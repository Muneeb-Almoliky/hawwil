import { NextResponse } from "next/server";
import { convert } from "@/lib/fx";
import { sendPickupNotifications } from "@/lib/notifications";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/config";
import type { CorridorCurrency } from "@/data/recipients";

export const runtime = "nodejs";

interface DueScheduleRow {
  id: string;
  user_id: string;
  amount_sar: number | string;
  recipients:
    | Array<{
        id: string;
        full_name: string;
        country: string;
        currency: CorridorCurrency;
        phone: string;
        masked_phone: string;
      }>
    | null;
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
  if (!isSupabaseConfigured() || !isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase service configuration is missing." },
      { status: 503 }
    );
  }

  const configuredSecret = process.env.SCHEDULE_RUNNER_SECRET?.trim();
  if (configuredSecret) {
    const providedHeaderSecret = request.headers.get("x-schedule-secret")?.trim();
    const authorization = request.headers.get("authorization")?.trim();
    const providedBearerSecret = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : "";
    const providedSecret = providedHeaderSecret || providedBearerSecret;
    if (!providedSecret || providedSecret !== configuredSecret) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Invalid schedule runner secret." },
        { status: 401 }
      );
    }
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("remittance_schedules")
    .select(
      "id, user_id, amount_sar, recipients(id, full_name, country, currency, phone, masked_phone)"
    )
    .eq("status", "active")
    .lte("next_run_at", nowIso)
    .order("next_run_at", { ascending: true })
    .limit(25);

  if (error || !data) {
    return NextResponse.json(
      { code: "DUE_SCHEDULES_FETCH_FAILED", message: "Could not fetch due schedules." },
      { status: 500 }
    );
  }

  const dueSchedules = data as DueScheduleRow[];
  let processed = 0;
  let executed = 0;
  const errors: Array<{ scheduleId: string; message: string }> = [];

  for (const schedule of dueSchedules) {
    processed += 1;
    try {
      const recipient =
        Array.isArray(schedule.recipients) && schedule.recipients.length > 0
          ? schedule.recipients[0]
          : null;

      if (!recipient) {
        throw new Error("Recipient relation missing for schedule.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", schedule.user_id)
        .single();

      if (profileError || !profile?.full_name) {
        throw new Error("Schedule owner profile missing.");
      }

      const amountSar = asNumber(schedule.amount_sar);
      const conversion = convert(amountSar, recipient.currency);
      const settlementUsdc = Math.round((conversion.amountSar / 3.75) * 100) / 100;
      const referenceId = generateReferenceId();
      const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
      const settlementPartner = `${recipient.country} Payout Network`;
      const routeReason = "Scheduled remittance routed by settlement engine.";

      const { data: transferRow, error: runError } = await supabase.rpc(
        "execute_remittance_schedule",
        {
          p_schedule_id: schedule.id,
          p_reference_id: referenceId,
          p_sender_name: profile.full_name,
          p_recipient_name: recipient.full_name,
          p_recipient_country: recipient.country,
          p_receiver_currency: recipient.currency,
          p_amount_sar: conversion.amountSar,
          p_fee_sar: conversion.feeSar,
          p_fx_rate: conversion.rate,
          p_receiver_amount: conversion.receiverAmount,
          p_pickup_code: pickupCode,
          p_settlement_rail: "usdc_settlement",
          p_settlement_usdc: settlementUsdc,
          p_settlement_partner: settlementPartner,
          p_route_reason: routeReason,
        }
      );

      if (runError || !transferRow) {
        throw new Error(runError?.message ?? "Schedule execution failed.");
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
      void notification;

      executed += 1;
    } catch (executionError) {
      errors.push({
        scheduleId: schedule.id,
        message:
          executionError instanceof Error
            ? executionError.message
            : "Unknown schedule execution error.",
      });
    }
  }

  return NextResponse.json({
    processed,
    executed,
    failed: errors.length,
    errors,
  });
}
