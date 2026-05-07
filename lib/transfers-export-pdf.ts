import PDFDocument from "pdfkit";
import type { TransferRecord } from "@/data/history";
import type { ProfileRecord } from "@/lib/data-access";
import { formatMoney } from "@/lib/format";
import { drawHawwilMarkPdf } from "@/lib/pdf-hawwil-mark";

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function buildTransfersPdfBuffer(
  profile: ProfileRecord,
  records: TransferRecord[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 44,
      info: { Title: "Hawwil transfer statement" },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    drawHawwilMarkPdf(doc, 44, 44, 34);
    doc.fontSize(20).fillColor("#059669").text("Hawwil", 88, 48);
    doc.fontSize(11).fillColor("#0c0a09").text("Transfer statement", 88, 72);
    doc.fontSize(9).fillColor("#57534e").text(`Account holder: ${truncate(profile.name, 64)}`, 44, 102);
    doc.text(`Generated: ${stamp} UTC`, 44, 114);
    doc.text(`Transfers listed: ${records.length}`, 44, 126);
    doc.y = 142;

    const col = {
      date: 44,
      ref: 86,
      recipient: 158,
      memo: 248,
      country: 318,
      sar: 378,
      status: 424,
    };
    const pageBottom = 758;
    let y = doc.y;

    function drawHeaderRow() {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#0c0a09");
      doc.text("Date", col.date, y, { width: 40 });
      doc.text("Reference", col.ref, y, { width: 68 });
      doc.text("Recipient", col.recipient, y, { width: 86 });
      doc.text("Memo", col.memo, y, { width: 66 });
      doc.text("Country", col.country, y, { width: 54 });
      doc.text("SAR", col.sar, y, { width: 40, align: "right" });
      doc.text("Status", col.status, y, { width: 100 });
      y += 14;
      doc.strokeColor("#e7e5e4").lineWidth(0.5).moveTo(col.date, y).lineTo(550, y).stroke();
      y += 8;
      doc.font("Helvetica");
    }

    drawHeaderRow();

    for (const r of records) {
      if (y > pageBottom) {
        doc.addPage();
        y = 44;
        drawHeaderRow();
      }
      const dateStr = r.timestamp.slice(0, 10);
      doc.fontSize(7).fillColor("#0c0a09");
      doc.text(dateStr, col.date, y, { width: 40 });
      doc.text(truncate(r.referenceId, 22), col.ref, y, { width: 68 });
      doc.text(truncate(r.recipientName, 22), col.recipient, y, { width: 86 });
      doc.text(truncate(r.senderNote ?? "", 28), col.memo, y, { width: 66 });
      doc.text(truncate(r.recipientCountry, 12), col.country, y, { width: 54 });
      doc.text(formatMoney(r.amountSar, "SAR"), col.sar, y, { width: 40, align: "right" });
      doc.text(truncate(r.status, 18), col.status, y, { width: 100 });
      y += 13;
    }

    doc.moveDown(2);
    const totalSar = records.reduce((sum, r) => sum + r.amountSar, 0);
    doc.fontSize(8).fillColor("#57534e").text(
      `Total: ${formatMoney(totalSar, "SAR")} SAR (sum of amounts in this export).`
    );

    doc.end();
  });
}
