import type { TransferRecord } from "@/data/history";

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildTransfersCsv(rows: TransferRecord[]): string {
  const headers = [
    "timestamp",
    "reference_id",
    "recipient_name",
    "recipient_country",
    "amount_sar",
    "receiver_amount",
    "receiver_currency",
    "fee_sar",
    "status",
    "transfer_purpose",
    "payout_method",
    "sender_note",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.timestamp,
        r.referenceId,
        r.recipientName,
        r.recipientCountry,
        String(r.amountSar),
        String(r.receiverAmount),
        r.receiverCurrency,
        String(r.feeSar),
        r.status,
        r.transferPurpose,
        r.payoutMethod ?? "",
        r.senderNote ?? "",
      ]
        .map((v) => escapeCsvCell(String(v)))
        .join(",")
    ),
  ];
  return `\uFEFF${lines.join("\n")}`;
}
