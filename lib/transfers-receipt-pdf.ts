import PDFDocument from "pdfkit";
import type { TransferRecord } from "@/data/history";
import type { ProfileRecord } from "@/lib/data-access";
import { formatMoney } from "@/lib/format";
import { drawHawwilMarkPdf } from "@/lib/pdf-hawwil-mark";

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function buildTransferReceiptPdfBuffer(
  profile: ProfileRecord,
  transfer: TransferRecord
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 44,
      info: { Title: `Hawwil receipt ${transfer.referenceId}` },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const stamp = new Date(transfer.timestamp).toISOString().slice(0, 19).replace("T", " ");

    drawHawwilMarkPdf(doc, 44, 44, 34);
    doc.fontSize(20).fillColor("#059669").text("Hawwil", 88, 48);
    doc.fontSize(11).fillColor("#0c0a09").text("Transfer receipt", 88, 72);
    doc.fontSize(9).fillColor("#57534e").text(`Reference: ${transfer.referenceId}`, 44, 110);
    doc.text(`Issued: ${stamp} UTC`);
    doc.text(`From: ${truncate(profile.name, 72)}`);
    doc.moveDown(1.2);

    doc.fontSize(10).fillColor("#0c0a09").text("Recipient", { underline: true });
    doc.fontSize(9).fillColor("#57534e");
    doc.text(`Name: ${transfer.recipientName}`);
    doc.text(`Country: ${transfer.recipientCountry}`);
    doc.moveDown(0.8);

    doc.fontSize(10).fillColor("#0c0a09").text("Amounts", { underline: true });
    doc.fontSize(9).fillColor("#57534e");
    doc.text(`You sent: ${formatMoney(transfer.amountSar, "SAR")} SAR`);
    doc.text(`Recipient gets: ${formatMoney(transfer.receiverAmount, transfer.receiverCurrency)} ${transfer.receiverCurrency}`);
    doc.text(`Fee: ${formatMoney(transfer.feeSar, "SAR")} SAR`);
    doc.moveDown(0.8);

    doc.fontSize(10).fillColor("#0c0a09").text("Status", { underline: true });
    doc.fontSize(9).fillColor("#57534e").text(transfer.status.replace(/_/g, " "));

    if (transfer.senderNote) {
      doc.moveDown(0.8);
      doc.fontSize(10).fillColor("#0c0a09").text("Memo", { underline: true });
      doc.fontSize(9).fillColor("#57534e").text(truncate(transfer.senderNote, 500));
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#57534e").text(
      "This receipt is issued for your records. For support, contact Hawwil with your reference ID.",
      { align: "left" }
    );

    doc.end();
  });
}
