import { NextResponse } from "next/server";
import type { TransferRecord } from "@/data/history";
import type { CorridorCurrency } from "@/data/recipients";
import { convert } from "@/lib/fx";
import { sendPickupNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

interface CreateTransferPayload {
  recipientId: string;
  amountSar: number;
}

function generateReferenceId(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HAW-${datePart}-${randomPart}`;
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  let payload: CreateTransferPayload;
  try {
    payload = (await request.json()) as CreateTransferPayload;
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const amountSar = asNumber(payload.amountSar);

  if (amountSar < 1) {
    return NextResponse.json(
      { code: "INVALID_AMOUNT", message: "Amount must be at least 1 SAR." },
      { status: 400 }
    );
  }

  const referenceId = generateReferenceId();
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Please sign in again." },
      { status: 401 }
    );
  }

  const { data: recipient, error: recipientError } = await supabase
    .from("recipients")
    .select("id, full_name, country, currency, phone, masked_phone")
    .eq("id", payload.recipientId)
    .eq("user_id", user.id)
    .single();

  if (recipientError || !recipient) {
    return NextResponse.json(
      { code: "RECIPIENT_NOT_FOUND", message: "Recipient not found." },
      { status: 404 }
    );
  }

  const conversion = convert(amountSar, recipient.currency as CorridorCurrency);
  const settlementUsdc = Math.round((conversion.amountSar / 3.75) * 100) / 100;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { code: "PROFILE_NOT_FOUND", message: "User profile not found." },
      { status: 404 }
    );
  }

  const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
  const settlementRail = "usdc_settlement";
  const settlementPartner = `${recipient.country} Payout Network`;
  const routeReason = "USDC settlement selected for partner settlement.";
  const { data: transferRow, error: transferError } = await supabase.rpc(
    "create_transfer_and_debit",
    {
      p_reference_id: referenceId,
      p_sender_name: profile.full_name,
      p_recipient_id: recipient.id,
      p_recipient_name: recipient.full_name,
      p_recipient_country: recipient.country,
      p_receiver_currency: recipient.currency,
      p_amount_sar: conversion.amountSar,
      p_fee_sar: conversion.feeSar,
      p_fx_rate: conversion.rate,
      p_receiver_amount: conversion.receiverAmount,
      p_transfer_purpose: "standard",
      p_pickup_code: pickupCode,
      p_payout_method: null,
      p_settlement_rail: settlementRail,
      p_settlement_usdc: settlementUsdc,
      p_settlement_partner: settlementPartner,
      p_route_reason: routeReason,
    }
  );

  if (transferError || !transferRow) {
    const isInsufficientBalance = transferError?.message.includes("Insufficient balance");
    return NextResponse.json(
      {
        code: isInsufficientBalance ? "INSUFFICIENT_BALANCE" : "TRANSFER_FAILED",
        message: isInsufficientBalance
          ? "Insufficient balance for this transfer."
          : "Could not complete transfer.",
      },
      { status: isInsufficientBalance ? 400 : 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const receiverUrl = `${appUrl}/r/${encodeURIComponent(referenceId)}`;
  const notificationBody = [
    `Hawwil transfer ready.`,
    `Ref: ${referenceId}`,
    `Pickup code: ${pickupCode}`,
    `Track: ${receiverUrl}`,
  ].join(" ");
  const notification = await sendPickupNotifications({
    toPhone: recipient.phone,
    body: notificationBody,
  });

  const transferRecord: TransferRecord = {
    id: transferRow.id,
    referenceId: transferRow.reference_id,
    senderName: transferRow.sender_name,
    recipientName: transferRow.recipient_name,
    recipientCountry: transferRow.recipient_country,
    amountSar: asNumber(transferRow.amount_sar),
    receiverAmount: asNumber(transferRow.receiver_amount),
    receiverCurrency: transferRow.receiver_currency,
    feeSar: asNumber(transferRow.fee_sar),
    fxRate: asNumber(transferRow.fx_rate),
    transferPurpose: "standard",
    payoutMethod: transferRow.payout_method ?? undefined,
    settlementRail: transferRow.settlement_rail ?? "usdc_settlement",
    settlementUsdc: asNumber(transferRow.settlement_usdc),
    settlementPartner: transferRow.settlement_partner ?? settlementPartner,
    routeReason: transferRow.route_reason ?? routeReason,
    notificationChannels: notification.channels,
    notificationStatus: notification.status,
    notificationNote: notification.note,
    recipientMaskedPhone: recipient.masked_phone,
    pickupCode: transferRow.pickup_code ?? undefined,
    pickedUpAt: transferRow.picked_up_at ?? null,
    status: transferRow.status,
    timestamp: transferRow.created_at,
  };

  return NextResponse.json({ transfer: transferRecord });
}
