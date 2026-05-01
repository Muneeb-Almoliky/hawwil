"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2, Clock3 } from "lucide-react";
import { useTransferStore } from "./store";

const FINALIZE_DELAY_MS = 2800;

export function StepProcessing() {
  const finalizeTransfer = useTransferStore((state) => state.finalizeTransfer);
  const isFinalizing = useTransferStore((state) => state.isFinalizing);
  const referenceId = useTransferStore((state) => state.referenceId);
  const transferKind = useTransferStore((state) => state.transferKind);
  const processingMessages = useMemo(() => {
    if (transferKind === "hawwil_peer") {
      return [
        "Payment authorized",
        "Crediting Hawwil balance",
        "Transfer complete",
      ];
    }
    return [
      "Payment authorized",
      "Rate locked",
      "Routing through payout network",
      "Recipient notified to choose payout method",
    ];
  }, [transferKind]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStepIndex((value) =>
        value < processingMessages.length - 1 ? value + 1 : value
      );
    }, 650);

    const timeout = window.setTimeout(() => {
      void finalizeTransfer();
    }, FINALIZE_DELAY_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [finalizeTransfer, processingMessages.length]);

  const statusRows = useMemo(
    () =>
      processingMessages.map((message, index) => {
        const isDone = index < activeStepIndex;
        const isCurrent = index === activeStepIndex;

        return {
          message,
          isDone,
          isCurrent,
        };
      }),
    [activeStepIndex, processingMessages]
  );

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Clock3 className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-950 tracking-tight" tabIndex={-1}>
              Processing transfer
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Finalizing your transfer details now.
            </p>
          </div>
        </div>

        {referenceId && (
          <p className="text-xs text-stone-500">
            Reference ID: <span className="font-mono font-semibold text-stone-700">{referenceId}</span>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col gap-3">
        {statusRows.map((row) => (
          <div key={row.message} className="flex items-center gap-3">
            {row.isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : row.isCurrent ? (
              <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
            )}
            <p
              className={[
                "text-sm",
                row.isDone
                  ? "text-emerald-700 font-semibold"
                  : row.isCurrent
                  ? "text-stone-900 font-semibold"
                  : "text-stone-500",
              ].join(" ")}
            >
              {row.message}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-500">
        {isFinalizing
          ? "Completing final checks..."
          : "Please keep this screen open for a moment."}
      </p>
    </div>
  );
}
