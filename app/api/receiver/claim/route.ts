import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface ClaimPayload {
  referenceId: string;
  pickupCode: string;
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  let payload: ClaimPayload;
  try {
    payload = (await request.json()) as ClaimPayload;
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const referenceId = payload.referenceId?.trim();
  const pickupCode = payload.pickupCode?.trim();
  if (!referenceId || !pickupCode) {
    return NextResponse.json(
      { code: "INVALID_FIELDS", message: "Reference and pickup code are required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_transfer_pickup", {
    p_reference_id: referenceId,
    p_pickup_code: pickupCode,
  });

  if (error || !Array.isArray(data) || data.length === 0) {
    return NextResponse.json(
      { code: "CLAIM_FAILED", message: "Pickup code is invalid or already used." },
      { status: 400 }
    );
  }

  const claimedTransfer = data[0] as {
    reference_id: string;
    picked_up_at: string;
  };

  return NextResponse.json({
    referenceId: claimedTransfer.reference_id,
    pickedUpAt: claimedTransfer.picked_up_at,
  });
}
