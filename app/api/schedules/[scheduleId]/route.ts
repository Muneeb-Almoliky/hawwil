import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ScheduleStatus = "active" | "paused" | "cancelled";

interface UpdateSchedulePayload {
  status: ScheduleStatus;
}

interface UpdateScheduleRouteContext {
  params: Promise<{ scheduleId: string }>;
}

export async function PATCH(
  request: Request,
  context: UpdateScheduleRouteContext
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Please sign in again." },
      { status: 401 }
    );
  }

  const { scheduleId } = await context.params;
  if (!scheduleId) {
    return NextResponse.json(
      { code: "INVALID_SCHEDULE_ID", message: "Schedule ID is required." },
      { status: 400 }
    );
  }

  let payload: UpdateSchedulePayload;
  try {
    payload = (await request.json()) as UpdateSchedulePayload;
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const status = payload.status;
  if (status !== "active" && status !== "paused" && status !== "cancelled") {
    return NextResponse.json(
      { code: "INVALID_STATUS", message: "Invalid schedule status." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("remittance_schedules")
    .update({ status })
    .eq("id", scheduleId)
    .eq("user_id", user.id)
    .select("id, status, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { code: "SCHEDULE_UPDATE_FAILED", message: "Could not update schedule." },
      { status: 404 }
    );
  }

  return NextResponse.json({ schedule: data });
}
