"use client";

import { useTransferStore, TRANSFER_STEPS } from "@/features/transfer/store";
import { currentUser } from "@/data/currentUser";
import { convert } from "@/lib/fx";
import { formatMoney } from "@/lib/format";
import { FX_RATES } from "@/data/fxRates";
import { SandboxInfo } from "./SandboxInfo";
import { useCountUp } from "@/hooks/useCountUp";
import { ArrowDown } from "lucide-react";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

const COUNTRY_FLAGS: Record<string, string> = {
  YE: "🇾🇪",
  JO: "🇯🇴",
  EG: "🇪🇬",
  SY: "🇸🇾",
  SA: "🇸🇦",
};

export function SummaryPanel() {
  const recipient = useTransferStore((s) => s.recipient);
  const transferKind = useTransferStore((s) => s.transferKind);
  const amountSar = useTransferStore((s) => s.amountSar);
  const step = useTransferStore((s) => s.step);

  const isSuccess = step === TRANSFER_STEPS.success;
  const isRecipientStep = step === TRANSFER_STEPS.recipient;
  const hasAmount = amountSar > 0;
  const conversion =
    recipient && hasAmount
      ? transferKind === "hawwil_peer"
        ? convert(amountSar, "SAR", { feeSar: 0 })
        : convert(amountSar, recipient.currency)
      : null;
  const animatedReceiver = useCountUp(conversion?.receiverAmount ?? 0);

  const sendingLabel = isSuccess ? "You sent" : "You're sending";
  const recipientLabel = isSuccess ? "Recipient received" : "Recipient gets";

  return (
    <div className="flex flex-col gap-5 h-full">
      <div>
        <h2 className="text-base font-black text-stone-950 tracking-tight">Transfer summary</h2>
        <p className="text-xs text-stone-400 mt-0.5">
          {isSuccess ? "Completed" : "Live preview"}
        </p>
      </div>

      {(!recipient || isRecipientStep) && (
        <div className="flex flex-col flex-1 items-center justify-center rounded-2xl border border-dashed border-stone-200 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
            <ArrowDown className="w-5 h-5 text-stone-300" />
          </div>
          <p className="text-sm font-semibold text-stone-400">
            Select a recipient to preview your transfer
          </p>
        </div>
      )}

      {recipient && !isRecipientStep && (
        <div className="flex flex-col gap-4">
          {/* From / To with avatars */}
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            {/* From */}
            <div className="flex items-center gap-3 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-sm font-black text-emerald-700 shrink-0">
                {getInitials(currentUser.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                  From
                </p>
                <p className="text-sm font-bold text-stone-950 truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-stone-400">{currentUser.country} · SAR</p>
              </div>
            </div>

            {/* Connector line */}
            <div className="flex items-center gap-3 py-1">
              <div className="w-10 flex items-center justify-center">
                <div className="w-px h-4 bg-stone-200" />
              </div>
            </div>

            {/* To */}
            <div className="flex items-center gap-3 pt-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-sm font-black text-teal-700">
                  {getInitials(recipient.name)}
                </div>
                <span className="absolute -bottom-2 -right-2 text-xs leading-none ring-2 ring-stone-50 rounded-full">
                  {COUNTRY_FLAGS[recipient.countryCode]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                  To
                </p>
                <p className="text-sm font-bold text-stone-950 truncate">
                  {recipient.name}
                </p>
                <p className="text-xs text-stone-400">{recipient.country} · {recipient.currency}</p>
              </div>
            </div>
          </div>

          {/* Amounts */}
          {conversion && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex flex-col gap-3">
              <div className="flex justify-between items-baseline">
                <p className="text-xs text-stone-400">{sendingLabel}</p>
                <p className="text-xl font-black text-stone-950 tabular-nums">
                  {formatMoney(conversion.amountSar, "SAR")}
                  <span className="text-xs font-bold text-stone-400 ml-1">SAR</span>
                </p>
              </div>
              <div className="h-px bg-stone-200" />
              <div className="flex justify-between items-baseline">
                <p className="text-xs text-stone-400">{recipientLabel}</p>
                <p
                  className="text-xl font-black text-emerald-600 tabular-nums"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {formatMoney(animatedReceiver, conversion.receiverCurrency)}
                  <span className="text-xs font-bold text-emerald-400 ml-1">
                    {conversion.receiverCurrency}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Fee breakdown — only before success */}
          {conversion && !isSuccess && transferKind === "international" && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
              <p className="text-xs font-bold text-stone-600 mb-3">Fee breakdown</p>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Send amount</span>
                  <span className="font-medium text-stone-700">{formatMoney(conversion.amountSar, "SAR")} SAR</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Hawwil fee</span>
                  <span className="font-medium text-stone-700">{conversion.feeSar} SAR</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Exchange rate</span>
                  <span className="font-medium text-stone-700">
                    1 SAR = {FX_RATES[conversion.receiverCurrency]} {conversion.receiverCurrency}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-stone-950 pt-1.5 border-t border-stone-200">
                  <span>After fees</span>
                  <span>{formatMoney(conversion.afterFeesSar, "SAR")} SAR</span>
                </div>
              </div>
            </div>
          )}
          {conversion && !isSuccess && transferKind === "hawwil_peer" && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
              <p className="text-xs font-bold text-stone-600 mb-2">Peer transfer</p>
              <p className="text-xs text-stone-500">
                No FX and no fee — the amount below is credited to their Hawwil SAR balance.
              </p>
            </div>
          )}

          {/* SandboxInfo — shown once, always */}
          <SandboxInfo />
        </div>
      )}
    </div>
  );
}
