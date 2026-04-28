import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { currentUser } from "@/data/currentUser";
import {
  findTransferByReferenceId,
  transferHistory,
  type TransferRecord,
} from "@/data/history";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/config";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";

type UserRole = "sender" | "ops_admin";

export interface ProfileRecord {
  id: string;
  name: string;
  country: string;
  currency: "SAR";
  verified: boolean;
  role: UserRole;
  balanceSar: number;
}

interface TransferRow {
  id: string;
  reference_id: string;
  sender_name: string;
  recipient_name: string;
  recipient_country: string;
  receiver_currency: TransferRecord["receiverCurrency"];
  amount_sar: number | string;
  receiver_amount: number | string;
  fee_sar: number | string;
  fx_rate: number | string;
  status: TransferRecord["status"];
  created_at: string;
}

function asNumber(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapTransferRow(row: TransferRow): TransferRecord {
  return {
    id: row.id,
    referenceId: row.reference_id,
    senderName: row.sender_name,
    recipientName: row.recipient_name,
    recipientCountry: row.recipient_country,
    amountSar: asNumber(row.amount_sar),
    receiverAmount: asNumber(row.receiver_amount),
    receiverCurrency: row.receiver_currency,
    feeSar: asNumber(row.fee_sar),
    fxRate: asNumber(row.fx_rate),
    status: row.status,
    timestamp: row.created_at,
  };
}

export function getFallbackProfile(): ProfileRecord {
  return {
    id: currentUser.id,
    name: currentUser.name,
    country: currentUser.country,
    currency: "SAR",
    verified: currentUser.verified,
    role: "ops_admin",
    balanceSar: currentUser.balanceSar,
  };
}

export async function getAuthenticatedProfile(): Promise<ProfileRecord | null> {
  if (!isSupabaseConfigured()) {
    return getFallbackProfile();
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, country, currency, verified, role, balance_sar")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.full_name,
    country: profile.country,
    currency: profile.currency,
    verified: profile.verified,
    role: profile.role,
    balanceSar: asNumber(profile.balance_sar),
  };
}

export async function getUserTransfers(limit?: number): Promise<TransferRecord[]> {
  if (!isSupabaseConfigured()) {
    return limit ? transferHistory.slice(0, limit) : transferHistory;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("transfers")
    .select(
      "id, reference_id, sender_name, recipient_name, recipient_country, receiver_currency, amount_sar, receiver_amount, fee_sar, fx_rate, status, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => mapTransferRow(row as TransferRow));
}

export async function getOpsTransfers(): Promise<TransferRecord[]> {
  if (!isSupabaseConfigured()) {
    return transferHistory;
  }

  const profile = await getAuthenticatedProfile();
  if (!profile || profile.role !== "ops_admin") {
    return [];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("transfers")
    .select(
      "id, reference_id, sender_name, recipient_name, recipient_country, receiver_currency, amount_sar, receiver_amount, fee_sar, fx_rate, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapTransferRow(row as TransferRow));
}

export async function getReceiverLookupTransfer(
  referenceId: string
): Promise<TransferRecord | null> {
  if (!isSupabaseConfigured()) {
    return findTransferByReferenceId(referenceId) ?? null;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  const client = isSupabaseServiceConfigured()
    ? createServiceClient()
    : createSupabaseClient(
        supabaseUrl,
        supabasePublishableKey
      );

  const { data, error } = await client.rpc("receiver_lookup", {
    reference: referenceId,
  });

  if (error || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const row = data[0] as {
    reference_id: string;
    sender_name: string;
    recipient_name: string;
    recipient_country: string;
    amount_sar: number | string;
    receiver_amount: number | string;
    receiver_currency: TransferRecord["receiverCurrency"];
    status: TransferRecord["status"];
    created_at: string;
  };

  return {
    id: `lookup-${row.reference_id}`,
    referenceId: row.reference_id,
    senderName: row.sender_name,
    recipientName: row.recipient_name,
    recipientCountry: row.recipient_country,
    amountSar: asNumber(row.amount_sar),
    receiverAmount: asNumber(row.receiver_amount),
    receiverCurrency: row.receiver_currency,
    feeSar: 0,
    fxRate: 0,
    status: row.status,
    timestamp: row.created_at,
  };
}
