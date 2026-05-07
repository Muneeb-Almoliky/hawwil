import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-verified-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buildTransferReceiptPdfBuffer } from "@/lib/transfers-receipt-pdf";
import { mapTransferRow, type TransferRow } from "@/lib/data-access";

export const runtime = "nodejs";

interface ReceiptRouteContext {
  params: Promise<{ referenceId: string }>;
}

export async function GET(_request: Request, context: ReceiptRouteContext) {
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

  const { referenceId: rawRef } = await context.params;
  const referenceId = rawRef?.trim();
  if (!referenceId) {
    return NextResponse.json(
      { code: "INVALID_REFERENCE", message: "Reference is required." },
      { status: 400 }
    );
  }

  const { data: row, error } = await supabase
    .from("transfers")
    .select(
      "id, reference_id, sender_name, recipient_name, recipient_country, receiver_currency, amount_sar, receiver_amount, fee_sar, fx_rate, transfer_purpose, payout_method, payout_details, settlement_rail, settlement_usdc, settlement_partner, route_reason, pickup_code, picked_up_at, status, created_at, sender_note"
    )
    .eq("user_id", user.id)
    .eq("reference_id", referenceId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Transfer not found." },
      { status: 404 }
    );
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, country, currency, verified, role, balance_sar")
    .eq("id", user.id)
    .single();

  if (profileError || !profileRow) {
    return NextResponse.json(
      { code: "PROFILE_NOT_FOUND", message: "Profile not found." },
      { status: 404 }
    );
  }

  const transfer = mapTransferRow(row as TransferRow);
  const profile = {
    id: profileRow.id,
    name: profileRow.full_name,
    country: profileRow.country,
    currency: profileRow.currency as "SAR",
    verified: profileRow.verified,
    role: profileRow.role as "sender" | "ops_admin",
    balanceSar: Number(profileRow.balance_sar),
  };

  const buffer = await buildTransferReceiptPdfBuffer(profile, transfer);
  const safeRef = referenceId.replace(/[^a-zA-Z0-9-]/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="hawwil-receipt-${safeRef}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
