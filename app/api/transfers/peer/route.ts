import { NextResponse } from "next/server";
import type { TransferRecord } from "@/data/history";
import { requireVerifiedUser } from "@/lib/auth/require-verified-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeTransferNote } from "@/lib/transfer-note";

export const runtime = "nodejs";

interface PeerTransferPayload {
  peerUserId?: string;
  amountSar?: number;
  senderNote?: string;
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

  let payload: PeerTransferPayload;
  try {
    payload = (await request.json()) as PeerTransferPayload;
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const amountSar = asNumber(payload.amountSar);
  const peerUserId = typeof payload.peerUserId === "string" ? payload.peerUserId.trim() : "";
  const senderNote = normalizeTransferNote(payload.senderNote) ?? null;

  if (!peerUserId) {
    return NextResponse.json(
      { code: "INVALID_PEER", message: "Recipient is required." },
      { status: 400 }
    );
  }

  if (amountSar < 1) {
    return NextResponse.json(
      { code: "INVALID_AMOUNT", message: "Amount must be at least 1 SAR." },
      { status: 400 }
    );
  }

  const referenceId = generateReferenceId();
  const auth = await requireVerifiedUser();
  if ("response" in auth) {
    return auth.response;
  }
  const { user, supabase } = auth;

  if (peerUserId === user.id) {
    return NextResponse.json(
      { code: "INVALID_PEER", message: "You cannot send to your own account." },
      { status: 400 }
    );
  }

  const { data: transferRow, error: transferError } = await supabase.rpc(
    "create_hawwil_peer_transfer",
    {
      p_reference_id: referenceId,
      p_recipient_user_id: peerUserId,
      p_amount_sar: amountSar,
      p_sender_note: senderNote,
    }
  );

  if (transferError || !transferRow) {
    const isInsufficientBalance = transferError?.message.includes("Insufficient balance");
    const isSelf = transferError?.message.includes("yourself");
    return NextResponse.json(
      {
        code: isInsufficientBalance
          ? "INSUFFICIENT_BALANCE"
          : isSelf
            ? "INVALID_PEER"
            : "TRANSFER_FAILED",
        message: isInsufficientBalance
          ? "Insufficient balance for this transfer."
          : isSelf
            ? "You cannot send to your own account."
            : "Could not complete transfer.",
      },
      { status: isInsufficientBalance || isSelf ? 400 : 500 }
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
    transferPurpose: transferRow.transfer_purpose ?? "hawwil_peer",
    payoutMethod: transferRow.payout_method ?? undefined,
    settlementRail: transferRow.settlement_rail ?? "hawwil_balance",
    settlementUsdc: asNumber(transferRow.settlement_usdc ?? 0),
    settlementPartner: transferRow.settlement_partner ?? "Hawwil",
    routeReason: transferRow.route_reason ?? "Instant balance transfer between Hawwil accounts.",
    senderNote: normalizeTransferNote(transferRow.sender_note ?? undefined),
    notificationChannels: undefined,
    notificationStatus: undefined,
    notificationNote: undefined,
    recipientMaskedPhone: undefined,
    pickupCode: transferRow.pickup_code ?? undefined,
    pickedUpAt: transferRow.picked_up_at ?? null,
    status: transferRow.status,
    timestamp: transferRow.created_at,
  };

  return NextResponse.json({ transfer: transferRecord });
}
