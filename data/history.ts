import type { CorridorCurrency } from "./recipients";

export interface TransferPayoutDetails {
  pickupCity?: string;
  receiverFullName?: string;
  walletProvider?: string;
  walletPhoneMasked?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumberMasked?: string;
}

export interface TransferRecord {
  id: string;
  referenceId: string;
  senderName: string;
  recipientName: string;
  recipientCountry: string;
  amountSar: number;
  receiverAmount: number;
  receiverCurrency: CorridorCurrency;
  feeSar: number;
  fxRate: number;
  transferPurpose: "standard" | "zakat" | "sadaqah" | "hawwil_peer";
  payoutMethod?: "cash_pickup" | "bank_account" | "mobile_wallet";
  payoutDetails?: TransferPayoutDetails;
  settlementRail: "local_liquidity" | "usdc_settlement" | "hawwil_balance";
  settlementUsdc: number;
  settlementPartner: string;
  routeReason: string;
  notificationChannels?: Array<"sms" | "whatsapp">;
  notificationStatus?: "mocked" | "sent" | "partial" | "failed";
  notificationNote?: string;
  recipientMaskedPhone?: string;
  pickupCode?: string;
  pickedUpAt?: string | null;
  status:
    | "processing"
    | "recipient_action_required"
    | "payout_pending"
    | "paid_out"
    | "failed";
  timestamp: string;
}

export const transferHistory: TransferRecord[] = [
  {
    id: "th-001",
    referenceId: "HAW-2026-0420-001",
    senderName: "Sara Al-Qahtani",
    recipientName: "Mohammed Al-Mekhlafi",
    recipientCountry: "Yemen",
    amountSar: 1000,
    receiverAmount: 137_900,
    receiverCurrency: "YER",
    feeSar: 15,
    fxRate: 140,
    transferPurpose: "standard",
    payoutMethod: "cash_pickup",
    settlementRail: "usdc_settlement",
    settlementUsdc: 266.67,
    settlementPartner: "Yemen Payout Network",
    routeReason: "YER payout pool is healthy.",
    status: "paid_out",
    timestamp: "2026-04-26T14:30:00Z",
  },
  {
    id: "th-002",
    referenceId: "HAW-2026-0424-002",
    senderName: "Sara Al-Qahtani",
    recipientName: "Ismail Al-Sharihi",
    recipientCountry: "Jordan",
    amountSar: 500,
    receiverAmount: 93.58,
    receiverCurrency: "JOD",
    feeSar: 7.5,
    fxRate: 0.19,
    transferPurpose: "standard",
    payoutMethod: "cash_pickup",
    settlementRail: "usdc_settlement",
    settlementUsdc: 133.33,
    settlementPartner: "Jordan Payout Network",
    routeReason: "JOD payout pool is healthy.",
    status: "paid_out",
    timestamp: "2026-04-27T09:15:00Z",
  },
];

let sessionHistory: TransferRecord[] = [];

export function appendSessionTransfer(record: TransferRecord): void {
  sessionHistory = [record, ...sessionHistory];
}

export function getFullHistory(): TransferRecord[] {
  return [...sessionHistory, ...transferHistory];
}

function normalizeReferenceId(referenceId: string): string {
  return referenceId.trim().toUpperCase();
}

export function findTransferByReferenceId(referenceId: string): TransferRecord | undefined {
  const normalizedReferenceId = normalizeReferenceId(referenceId);
  return getFullHistory().find(
    (record) => normalizeReferenceId(record.referenceId) === normalizedReferenceId
  );
}
