import { NextResponse } from "next/server";
import type { TransferRecord } from "@/data/history";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface CompleteTransferRouteContext {
  params: Promise<{
    referenceId: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: CompleteTransferRouteContext
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  void request;

  const { referenceId } = await context.params;
  if (!referenceId) {
    return NextResponse.json(
      { code: "INVALID_REFERENCE", message: "Reference ID is required." },
      { status: 400 }
    );
  }

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

  const { data: transferRow, error: transferError } = await supabase.rpc(
    "complete_transfer",
    {
      p_reference_id: referenceId,
    }
  );

  if (transferError || !transferRow) {
    return NextResponse.json(
      { code: "TRANSFER_NOT_FOUND", message: "Could not finalize transfer." },
      { status: 404 }
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
    transferPurpose: transferRow.transfer_purpose ?? "standard",
    payoutMethod: transferRow.payout_method ?? undefined,
    settlementRail: transferRow.settlement_rail ?? "usdc_settlement",
    settlementUsdc: asNumber(transferRow.settlement_usdc),
    settlementPartner: transferRow.settlement_partner ?? "Destination Payout Network",
    routeReason: transferRow.route_reason ?? "Settlement route selected by transfer engine.",
    pickupCode: transferRow.pickup_code ?? undefined,
    pickedUpAt: transferRow.picked_up_at ?? null,
    status: transferRow.status,
    timestamp: transferRow.created_at,
  };

  return NextResponse.json({ transfer: transferRecord });
}
