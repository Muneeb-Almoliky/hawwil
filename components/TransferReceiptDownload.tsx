"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TransferReceiptDownloadProps {
  referenceId: string;
  className?: string;
  label?: string;
}

export function TransferReceiptDownload({
  referenceId,
  className,
  label = "Receipt",
}: TransferReceiptDownloadProps) {
  const [busy, setBusy] = useState(false);

  async function downloadReceipt() {
    setBusy(true);
    try {
      const res = await fetch(`/api/transfers/${encodeURIComponent(referenceId)}/receipt`);
      if (!res.ok) {
        toast.error("Could not download receipt. Try again or check your connection.");
        return;
      }
      const blob = await res.blob();
      const header = res.headers.get("Content-Disposition");
      const match = header?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `hawwil-receipt-${referenceId}.pdf`;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Could not download receipt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void downloadReceipt()}
      className={
        className ??
        "inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-950 transition-colors disabled:opacity-60"
      }
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
