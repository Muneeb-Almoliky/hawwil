"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function TransferHistoryExportActions() {
  const [busy, setBusy] = useState(false);

  async function downloadExport(url: string, fallbackFilename: string, kind: "pdf" | "csv") {
    setBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        toast.error("Download failed. Try signing in again.");
        return;
      }
      const blob = await res.blob();
      const header = res.headers.get("Content-Disposition");
      const match = header?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? fallbackFilename;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      toast.success(kind === "pdf" ? "PDF downloaded" : "CSV downloaded");
    } catch {
      toast.error("Could not download. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            downloadExport("/api/transfers/export/pdf", `hawwil-transfers-${stamp}.pdf`, "pdf")
          }
          className="border-stone-200 text-stone-950 hover:bg-stone-50 gap-1.5"
        >
          <FileDown className="h-4 w-4 text-emerald-700" aria-hidden />
          Download PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            downloadExport("/api/transfers/export/csv", `hawwil-transfers-${stamp}.csv`, "csv")
          }
          className="border-stone-200 text-stone-950 hover:bg-stone-50 gap-1.5"
        >
          <FileDown className="h-4 w-4 text-teal-700" aria-hidden />
          Download CSV
        </Button>
      </div>
    </div>
  );
}
