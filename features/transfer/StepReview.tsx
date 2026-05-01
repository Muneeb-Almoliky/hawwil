"use client";

import { useTransferStore, TRANSFER_STEPS } from "./store";
import { convert } from "@/lib/fx";
import { formatMoney } from "@/lib/format";
import { Loader2, ShieldCheck } from "lucide-react";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

interface StepReviewProps {
  senderName: string;
  senderCountry: string;
}

export function StepReview({ senderName, senderCountry }: StepReviewProps) {
  const recipient = useTransferStore((s) => s.recipient);
  const transferKind = useTransferStore((s) => s.transferKind);
  const amountSar = useTransferStore((s) => s.amountSar);
  const isConfirming = useTransferStore((s) => s.isConfirming);
  const errorMessage = useTransferStore((s) => s.errorMessage);
  const goTo = useTransferStore((s) => s.goTo);
  const clearError = useTransferStore((s) => s.clearError);
  const confirm = useTransferStore((s) => s.confirm);

  const conversion =
    recipient && amountSar > 0
      ? transferKind === "hawwil_peer"
        ? convert(amountSar, "SAR", { feeSar: 0 })
        : convert(amountSar, recipient.currency)
      : null;

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div className="flex flex-col gap-1">
        <h1
          className="text-3xl font-black text-stone-950 tracking-tight"
          tabIndex={-1}
        >
          Review transfer
        </h1>
        <p className="text-sm text-stone-400">Confirm the details below</p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {/* From / To */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-sm font-black text-emerald-700 shrink-0">
              {getInitials(senderName)}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">From</p>
              <p className="text-sm font-bold text-stone-950">{senderName}</p>
              <p className="text-xs text-stone-400">{senderCountry}</p>
            </div>
          </div>
          {recipient && (
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-sm font-black text-teal-700 shrink-0">
                {getInitials(recipient.name)}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">To</p>
                <p className="text-sm font-bold text-stone-950">{recipient.name}</p>
                <p className="text-xs text-stone-400">{recipient.country}</p>
              </div>
            </div>
          )}
        </div>

        {/* Amount summary */}
        {conversion && (
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-0.5">Total amount</p>
                <p className="text-2xl font-black text-stone-950 tabular-nums">
                  {formatMoney(conversion.amountSar, "SAR")}
                  <span className="text-sm font-bold text-stone-400 ml-1">SAR</span>
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {transferKind === "hawwil_peer"
                    ? "No Hawwil fee on peer transfers"
                    : `Includes ${conversion.feeSar} SAR Hawwil fee`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-0.5">
                  {transferKind === "hawwil_peer" ? "Their balance receives" : "Recipient receives"}
                </p>
                <p className="text-2xl font-black text-emerald-600 tabular-nums">
                  {formatMoney(conversion.receiverAmount, conversion.receiverCurrency)}
                  <span className="text-sm font-bold text-emerald-400 ml-1">
                    {conversion.receiverCurrency}
                  </span>
                </p>
                <p className="text-xs text-emerald-600 mt-0.5 font-semibold">
                  {transferKind === "hawwil_peer" ? "Instant to their Hawwil balance" : "Instantly"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trust assurance */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-stone-500">
            {transferKind === "hawwil_peer" ? (
              "Peer transfers move SAR between verified Hawwil balances only."
            ) : (
              <>
                This transfer is protected under our{" "}
                <span className="font-semibold text-stone-700">licensed payment infrastructure</span>
              </>
            )}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-rose-700">{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={confirm}
          disabled={isConfirming}
          className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 text-base transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          {isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Routing through Hawwil…
            </>
          ) : (
            "Confirm transfer"
          )}
        </button>
        {!isConfirming && (
          <button
            type="button"
            onClick={() => {
              clearError();
              goTo(TRANSFER_STEPS.amount);
            }}
            className="flex items-center justify-center w-full rounded-2xl border border-stone-200 bg-white shadow-sm hover:bg-stone-50 text-stone-700 font-bold py-4 text-base transition-all active:scale-[0.98]"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
