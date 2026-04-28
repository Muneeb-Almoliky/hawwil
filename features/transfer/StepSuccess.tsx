"use client";

import { useState } from "react";
import Link from "next/link";
import { useTransferStore } from "./store";
import { getRecipientById } from "@/data/recipients";
import { convert } from "@/lib/fx";
import { formatMoney } from "@/lib/format";
import { BrandHeader } from "@/components/BrandHeader";
import { CheckCircle, Copy, Check, Zap } from "lucide-react";

export function StepSuccess() {
  const recipientId = useTransferStore((s) => s.recipientId);
  const amountSar = useTransferStore((s) => s.amountSar);
  const referenceId = useTransferStore((s) => s.referenceId);
  const reset = useTransferStore((s) => s.reset);

  const [copied, setCopied] = useState(false);

  const recipient = recipientId ? getRecipientById(recipientId) : null;
  const conversion =
    recipient && amountSar > 0 ? convert(amountSar, recipient.currency) : null;

  async function handleCopy() {
    if (!referenceId) return;
    await navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col flex-1 gap-6">
      <BrandHeader />

      {/* Success hero — big and celebratory */}
      <div className="rounded-2xl bg-emerald-600 p-8 flex flex-col items-center text-center gap-4 shadow-md relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-white" />
        </div>

        <div className="relative flex flex-col gap-1">
          <h1 className="text-xl font-bold text-white" tabIndex={-1}>
            Transfer sent!
          </h1>
          {conversion && recipient && (
            <>
              <p className="text-4xl font-black text-white tabular-nums leading-none mt-1">
                {formatMoney(conversion.receiverAmount, conversion.receiverCurrency)}
                <span className="text-xl font-bold text-emerald-200 ml-2">
                  {conversion.receiverCurrency}
                </span>
              </p>
              <p className="text-emerald-200 text-sm mt-1">
                arrived to {recipient.name}
              </p>
            </>
          )}
        </div>

        <div className="relative flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
          <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
          <span className="text-xs font-bold text-white">Arrived instantly</span>
        </div>
      </div>

      {/* Receipt details */}
      <div className="flex flex-col gap-3 flex-1">
        {/* Reference ID */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
            Reference ID
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-mono font-bold text-stone-950">
              {referenceId}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy reference ID"
              className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-950 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary row */}
        {conversion && (
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                You sent
              </p>
              <p className="text-sm font-bold text-stone-950">
                {formatMoney(conversion.amountSar, "SAR")} SAR
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                Arrival
              </p>
              <p className="text-sm font-bold text-emerald-600">Instant</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                Fee paid
              </p>
              <p className="text-sm font-bold text-stone-950">{conversion.feeSar} SAR</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                Rate
              </p>
              <p className="text-sm font-bold text-stone-950">
                1 SAR = {conversion.rate} {conversion.receiverCurrency}
              </p>
            </div>
          </div>
        )}

        {/* SMS notification line */}
        {recipient && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-800 leading-relaxed">
              <span className="font-bold">{recipient.name}</span> will receive an SMS with a
              pickup code at{" "}
              <span className="font-mono font-bold">{recipient.maskedPhone}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Link
          href="/history"
          className="flex items-center justify-center w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 text-base transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          View history
        </Link>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center w-full rounded-2xl border border-stone-200 bg-white shadow-sm hover:bg-stone-50 text-stone-700 font-bold py-4 text-base transition-all active:scale-[0.98]"
        >
          Send another transfer
        </button>
      </div>
    </div>
  );
}
