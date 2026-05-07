import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-verified-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ScheduleFrequency = "weekly" | "monthly";

interface CreateSchedulePayload {
  recipientId: string;
  amountSar: number;
  frequency: ScheduleFrequency;
  startDate: string;
  endDate?: string | null;
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeNextRunAt(startDateIso: string): string {
  const base = new Date(`${startDateIso}T09:00:00.000Z`);
  return base.toISOString();
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", schedules: [] },
      { status: 503 }
    );
  }

  const auth = await requireVerifiedUser();
  if ("response" in auth) {
    return auth.response;
  }
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from("remittance_schedules")
    .select(
      "id, recipient_id, amount_sar, frequency, next_run_at, start_date, end_date, status, created_at, recipients(full_name, country, masked_phone)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return NextResponse.json(
      { code: "SCHEDULES_FETCH_FAILED", schedules: [] },
      { status: 500 }
    );
  }

  return NextResponse.json({ schedules: data });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const auth = await requireVerifiedUser();
  if ("response" in auth) {
    return auth.response;
  }
  const { user, supabase } = auth;

  let payload: CreateSchedulePayload;
  try {
    payload = (await request.json()) as CreateSchedulePayload;
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const recipientId = payload.recipientId?.trim();
  const amountSar = Number(payload.amountSar);
  const frequency = payload.frequency;
  const startDate = payload.startDate?.trim() || getTodayIsoDate();
  const endDate = payload.endDate?.trim() || null;

  if (!recipientId || !Number.isFinite(amountSar) || amountSar <= 0) {
    return NextResponse.json(
      { code: "INVALID_FIELDS", message: "Recipient and amount are required." },
      { status: 400 }
    );
  }

  if (frequency !== "weekly" && frequency !== "monthly") {
    return NextResponse.json(
      { code: "INVALID_FREQUENCY", message: "Frequency must be weekly or monthly." },
      { status: 400 }
    );
  }

  if (endDate && endDate < startDate) {
    return NextResponse.json(
      { code: "INVALID_DATES", message: "End date must be after start date." },
      { status: 400 }
    );
  }

  const { data: recipient, error: recipientError } = await supabase
    .from("recipients")
    .select("id")
    .eq("id", recipientId)
    .eq("user_id", user.id)
    .single();

  if (recipientError || !recipient) {
    return NextResponse.json(
      { code: "RECIPIENT_NOT_FOUND", message: "Recipient not found." },
      { status: 404 }
    );
  }

  const nextRunAt = computeNextRunAt(startDate);

  const { data, error } = await supabase
    .from("remittance_schedules")
    .insert({
      user_id: user.id,
      recipient_id: recipientId,
      amount_sar: amountSar,
      frequency,
      next_run_at: nextRunAt,
      start_date: startDate,
      end_date: endDate,
      status: "active",
    })
    .select(
      "id, recipient_id, amount_sar, frequency, next_run_at, start_date, end_date, status, created_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { code: "SCHEDULE_CREATE_FAILED", message: "Could not create schedule." },
      { status: 500 }
    );
  }

  return NextResponse.json({ schedule: data });
}
