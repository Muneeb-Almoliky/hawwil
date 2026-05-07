"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, ChevronRight, QrCode } from "lucide-react";
import { QrCodeBlock } from "@/components/QrCodeBlock";
import { cn } from "@/lib/utils";

interface ReceivePeerQrCardProps {
  hawwilUserId: string;
  /** Softer chrome when nested inside the home Activity panel */
  variant?: "standalone" | "embedded";
}

export function ReceivePeerQrCard({
  hawwilUserId,
  variant = "standalone",
}: ReceivePeerQrCardProps) {
  const panelId = useId();
  const [receiveUrl, setReceiveUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!hawwilUserId) {
      setReceiveUrl("");
      return;
    }
    setReceiveUrl(
      `${window.location.origin}/transfer?peerUserId=${encodeURIComponent(hawwilUserId)}`
    );
  }, [hawwilUserId]);

  if (!receiveUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        "overflow-hidden border border-stone-200 bg-white",
        variant === "embedded"
          ? "rounded-xl shadow-none"
          : "rounded-2xl shadow-sm"
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors",
          "hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 focus-visible:ring-inset"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-stone-200">
          <QrCode className="h-5 w-5 text-emerald-700" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-950">Receive from a Hawwil user</p>
          <p className="text-xs text-stone-600 mt-0.5 leading-snug">
            Tap to show a QR others can scan while signed in to send you SAR.
          </p>
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
        )}
      </button>

      {isOpen ? (
        <div id={panelId} className="px-4 pb-4 pt-0 flex flex-col gap-3 border-t border-stone-200">
          <p className="text-sm text-stone-600 text-center leading-snug max-w-sm mx-auto">
            Show this code to someone who uses Hawwil. They scan it while signed in, then send you a
            peer transfer in SAR.
          </p>
          <div className="flex justify-center">
            <QrCodeBlock
              value={receiveUrl}
              caption="Scan (signed in) to send to this account"
              size={176}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
