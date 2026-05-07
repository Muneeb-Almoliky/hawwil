import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { currentUser } from "@/data/currentUser";
import {
  findTransferByReferenceId,
  transferHistory,
  type TransferRecord,
} from "@/data/history";
import { isEmailVerified } from "@/lib/auth/email-verification";
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
import type { Recipient } from "@/data/recipients";

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

export interface LiquidityPoolRecord {
  country: string;
  currency: string;
  availableBalance: number;
}

export interface ScheduleRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientCountry: string;
  recipientMaskedPhone: string;
  amountSar: number;
  frequency: "weekly" | "monthly";
  nextRunAt: string;
  startDate: string;
  endDate: string | null;
  status: "active" | "paused" | "cancelled";
  createdAt: string;
}

export interface TransferRow {
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
  transfer_purpose?: TransferRecord["transferPurpose"];
  payout_method?: TransferRecord["payoutMethod"];
  payout_details?: unknown;
  settlement_rail?: TransferRecord["settlementRail"];
  settlement_usdc?: number | string;
  settlement_partner?: string | null;
  route_reason?: string | null;
  pickup_code?: string | null;
  picked_up_at?: string | null;
  sender_note?: string | null;
  status: TransferRecord["status"];
  created_at: string;
}

interface ScheduleRow {
  id: string;
  recipient_id: string;
  amount_sar: number | string;
  frequency: "weekly" | "monthly";
  next_run_at: string;
  start_date: string;
  end_date: string | null;
  status: "active" | "paused" | "cancelled";
  created_at: string;
  recipients:
    | {
        full_name: string;
        country: string;
        masked_phone: string;
      }
    | null;
}

function asNumber(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asPayoutDetails(value: unknown): TransferRecord["payoutDetails"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const details = value as Record<string, unknown>;
  const payoutDetails: TransferRecord["payoutDetails"] = {};

  if (typeof details.pickupCity === "string") {
    payoutDetails.pickupCity = details.pickupCity;
  }
  if (typeof details.receiverFullName === "string") {
    payoutDetails.receiverFullName = details.receiverFullName;
  }
  if (typeof details.walletProvider === "string") {
    payoutDetails.walletProvider = details.walletProvider;
  }
  if (typeof details.walletPhoneMasked === "string") {
    payoutDetails.walletPhoneMasked = details.walletPhoneMasked;
  }
  if (typeof details.bankName === "string") {
    payoutDetails.bankName = details.bankName;
  }
  if (typeof details.accountHolder === "string") {
    payoutDetails.accountHolder = details.accountHolder;
  }
  if (typeof details.accountNumberMasked === "string") {
    payoutDetails.accountNumberMasked = details.accountNumberMasked;
  }

  return Object.keys(payoutDetails).length > 0 ? payoutDetails : undefined;
}

export function mapTransferRow(row: TransferRow): TransferRecord {
  const note = row.sender_note?.trim();
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
    transferPurpose: row.transfer_purpose ?? "standard",
    payoutMethod: row.payout_method ?? undefined,
    payoutDetails: asPayoutDetails(row.payout_details),
    settlementRail: row.settlement_rail ?? "usdc_settlement",
    settlementUsdc: asNumber(row.settlement_usdc ?? 0),
    settlementPartner: row.settlement_partner ?? "Destination Payout Network",
    routeReason: row.route_reason ?? "Settlement route selected by transfer engine.",
    pickupCode: row.pickup_code ?? undefined,
    pickedUpAt: row.picked_up_at ?? null,
    senderNote: note && note.length > 0 ? note : undefined,
    status: row.status,
    timestamp: row.created_at,
  };
}

function mapScheduleRow(row: ScheduleRow): ScheduleRecord {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    recipientName: row.recipients?.full_name ?? "Recipient",
    recipientCountry: row.recipients?.country ?? "Unknown",
    recipientMaskedPhone: row.recipients?.masked_phone ?? "N/A",
    amountSar: asNumber(row.amount_sar),
    frequency: row.frequency,
    nextRunAt: row.next_run_at,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
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

  if (!isEmailVerified(user)) {
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

  if (!isEmailVerified(user)) {
    return [];
  }

  let query = supabase
    .from("transfers")
    .select(
      "id, reference_id, sender_name, recipient_name, recipient_country, receiver_currency, amount_sar, receiver_amount, fee_sar, fx_rate, transfer_purpose, payout_method, payout_details, settlement_rail, settlement_usdc, settlement_partner, route_reason, pickup_code, picked_up_at, status, created_at, sender_note"
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
      "id, reference_id, sender_name, recipient_name, recipient_country, receiver_currency, amount_sar, receiver_amount, fee_sar, fx_rate, transfer_purpose, payout_method, payout_details, settlement_rail, settlement_usdc, settlement_partner, route_reason, pickup_code, picked_up_at, status, created_at, sender_note"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapTransferRow(row as TransferRow));
}

export async function getOpsUserCount(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 2;
  }

  const profile = await getAuthenticatedProfile();
  if (!profile || profile.role !== "ops_admin") {
    return 0;
  }

  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getLiquidityPools(): Promise<LiquidityPoolRecord[]> {
  if (!isSupabaseConfigured()) {
    return [
      { country: "Jordan", currency: "JOD", availableBalance: 50000 },
      { country: "Egypt", currency: "EGP", availableBalance: 500000 },
      { country: "Yemen", currency: "YER", availableBalance: 10000000 },
      { country: "Syria", currency: "SYP", availableBalance: 200000000 },
    ];
  }

  const profile = await getAuthenticatedProfile();
  if (!profile || profile.role !== "ops_admin") {
    return [];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("liquidity_pools")
    .select("country, currency, available_balance")
    .order("country", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    country: row.country,
    currency: row.currency,
    availableBalance: asNumber(row.available_balance),
  }));
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
    transfer_purpose?: TransferRecord["transferPurpose"];
    payout_method?: TransferRecord["payoutMethod"];
    payout_details?: unknown;
    settlement_rail?: TransferRecord["settlementRail"];
    settlement_usdc?: number | string;
    settlement_partner?: string | null;
    route_reason?: string | null;
    pickup_code?: string | null;
    picked_up_at?: string | null;
    sender_note?: string | null;
    status: TransferRecord["status"];
    created_at: string;
  };

  const note = row.sender_note?.trim();

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
    transferPurpose: row.transfer_purpose ?? "standard",
    payoutMethod: row.payout_method ?? undefined,
    payoutDetails: asPayoutDetails(row.payout_details),
    settlementRail: row.settlement_rail ?? "usdc_settlement",
    settlementUsdc: asNumber(row.settlement_usdc ?? 0),
    settlementPartner: row.settlement_partner ?? "Destination Payout Network",
    routeReason: row.route_reason ?? "Settlement route selected by transfer engine.",
    pickupCode: row.pickup_code ?? undefined,
    pickedUpAt: row.picked_up_at ?? null,
    senderNote: note && note.length > 0 ? note : undefined,
    status: row.status,
    timestamp: row.created_at,
  };
}

export async function getUserRecipientsForScheduling(): Promise<Recipient[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  if (!isEmailVerified(user)) {
    return [];
  }

  const { data, error } = await supabase
    .from("recipients")
    .select("id, full_name, country, country_code, currency, phone, masked_phone")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.full_name,
    country: row.country,
    countryCode: row.country_code,
    currency: row.currency,
    phone: row.phone,
    maskedPhone: row.masked_phone,
  }));
}

export async function getUserSchedules(): Promise<ScheduleRecord[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  if (!isEmailVerified(user)) {
    return [];
  }

  const { data, error } = await supabase
    .from("remittance_schedules")
    .select(
      "id, recipient_id, amount_sar, frequency, next_run_at, start_date, end_date, status, created_at, recipients(full_name, country, masked_phone)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapScheduleRow(row as unknown as ScheduleRow));
}
