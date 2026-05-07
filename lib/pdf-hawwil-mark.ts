import type PDFDocument from "pdfkit";

export function drawHawwilMarkPdf(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  size: number
): void {
  const r = Math.max(3.5, size * 0.24);
  const t = Math.max(1.1, size * 0.075);
  doc.save();
  doc.roundedRect(x, y, size, size, r).fill("#059669");
  doc.strokeColor("#ffffff").lineWidth(t).lineCap("round").lineJoin("round");
  const pad = size * 0.2;
  const ix = x + pad;
  const iy = y + pad;
  const iw = size - pad * 2;
  const ih = size - pad * 2;
  const midY = iy + ih * 0.52;
  const col = ix + iw * 0.34;
  doc.moveTo(ix, iy).lineTo(ix, iy + ih).stroke();
  doc.moveTo(col, iy).lineTo(col, iy + ih).stroke();
  doc.moveTo(ix, midY).lineTo(col, midY).stroke();
  const ax = ix + iw * 0.44;
  const ay = iy + ih * 0.62;
  doc
    .moveTo(ax, ay + ih * 0.18)
    .lineTo(ax + iw * 0.42, ay - ih * 0.1)
    .stroke();
  doc
    .moveTo(ax + iw * 0.3, ay - ih * 0.1)
    .lineTo(ax + iw * 0.42, ay - ih * 0.1)
    .lineTo(ax + iw * 0.42, ay + ih * 0.02)
    .stroke();
  doc.restore();
}
