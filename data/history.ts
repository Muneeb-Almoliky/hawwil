import type { CorridorCurrency } from "./recipients";

export interface TransferRecord {
  id: string;
  referenceId: string;
  recipientName: string;
  recipientCountry: string;
  amountSar: number;
  receiverAmount: number;
  receiverCurrency: CorridorCurrency;
  feeSar: number;
  fxRate: number;
  status: "completed";
  timestamp: string;
}

export const transferHistory: TransferRecord[] = [
  {
    id: "th-001",
    referenceId: "HAW-2026-0420-001",
    recipientName: "Mohammed Al-Mekhlafi",
    recipientCountry: "Yemen",
    amountSar: 1000,
    receiverAmount: 137_900,
    receiverCurrency: "YER",
    feeSar: 15,
    fxRate: 140,
    status: "completed",
    timestamp: "2026-04-26T14:30:00Z",
  },
  {
    id: "th-002",
    referenceId: "HAW-2026-0424-002",
    recipientName: "Ismail Al-Sharihi",
    recipientCountry: "Jordan",
    amountSar: 500,
    receiverAmount: 93.58,
    receiverCurrency: "JOD",
    feeSar: 7.5,
    fxRate: 0.19,
    status: "completed",
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
