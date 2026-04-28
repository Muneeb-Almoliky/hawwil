import { NextResponse } from "next/server";
import { getRecipientById } from "@/data/recipients";
import type { TransferRecord } from "@/data/history";
import { convert } from "@/lib/fx";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

  const recipient = getRecipientById(payload.recipientId);
  if (!recipient) {
    return NextResponse.json(
      { code: "RECIPIENT_NOT_FOUND", message: "Recipient not found." },
      { status: 404 }
    );
  }

  const amountSar = asNumber(payload.amountSar);
  if (amountSar < 1) {
    return NextResponse.json(
      { code: "INVALID_AMOUNT", message: "Amount must be at least 1 SAR." },
      { status: 400 }
    );
  }

  const conversion = convert(amountSar, recipient.currency);
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

  const { data: transferRow, error: transferError } = await supabase.rpc(
    "create_transfer_and_debit",
    {
      p_reference_id: referenceId,
      p_sender_name: profile.full_name,
      p_recipient_id: recipient.id,
      p_recipient_name: recipient.name,
      p_recipient_country: recipient.country,
      p_receiver_currency: conversion.receiverCurrency,
      p_amount_sar: conversion.amountSar,
      p_fee_sar: conversion.feeSar,
      p_fx_rate: conversion.rate,
      p_receiver_amount: conversion.receiverAmount,
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
    status: "completed",
    timestamp: transferRow.created_at,
  };

  return NextResponse.json({ transfer: transferRecord });
}
