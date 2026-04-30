"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useTransferStore, TRANSFER_STEPS } from "./store";
import { computeFee, convert } from "@/lib/fx";
import { formatMoney } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import { FX_RATES } from "@/data/fxRates";

export function StepAmount() {
  const recipient = useTransferStore((s) => s.recipient);
  const storedAmount = useTransferStore((s) => s.amountSar);
  const setAmount = useTransferStore((s) => s.setAmount);
  const goTo = useTransferStore((s) => s.goTo);

  const [inputValue, setInputValue] = useState(
    storedAmount > 0 ? String(storedAmount) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const parsedAmount = parseFloat(inputValue) || 0;
  const conversion =
    recipient && parsedAmount > 0
      ? convert(parsedAmount, recipient.currency)
      : null;
  const animatedReceiverAmount = useCountUp(conversion?.receiverAmount ?? 0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    setInputValue(val);
    setAmount(parseFloat(val) || 0);
  }

  function handleContinue() {
    if (parsedAmount >= 1) {
      goTo(TRANSFER_STEPS.review);
    }
  }

  const rate = recipient ? FX_RATES[recipient.currency] : null;

  return (
    <div className="flex flex-col flex-1 gap-6 max-w-lg">
      <div className="flex flex-col gap-1">
        <h1
          className="text-3xl font-black text-stone-950 tracking-tight"
          tabIndex={-1}
        >
          How much?
        </h1>
        {recipient && (
          <p className="text-sm text-stone-400">
            Sending to {recipient.name} · {recipient.country}
          </p>
        )}
      </div>

      {/* Hero-style dual-field calculator — no card, raw layout */}
      <div className="flex flex-col flex-1">
        {/* You send */}
        <div className="px-1">
          <label
            htmlFor="amount-input"
            className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3"
          >
            You send
          </label>
          <div className="flex items-center gap-3">
            <input
              id="amount-input"
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={handleInput}
              placeholder="0"
              className="flex-1 text-7xl font-bold text-stone-950 tabular-nums bg-transparent outline-none placeholder:text-stone-200 min-w-0"
            />
            <div className="flex items-center shrink-0 bg-stone-100 rounded-xl px-3 py-2">
              <span className="text-sm font-bold text-stone-700">SAR</span>
            </div>
          </div>
        </div>

        {/* Divider with rate badge */}
        <div className="relative my-7 border-t border-stone-200">
          <div className="absolute left-0 -top-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
              <ArrowDown className="w-4 h-4 text-white" />
            </div>
            {rate && recipient && (
              <span className="text-xs font-semibold text-stone-500 bg-stone-100 border border-stone-200 rounded-full px-2.5 py-0.5">
                1 SAR = {rate} {recipient.currency}
              </span>
            )}
          </div>
        </div>

        {/* Recipient gets */}
        <div className="px-1 pt-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            {recipient?.name ?? "Recipient"} gets
          </p>
          <div className="flex items-center gap-3">
            <p
              className="flex-1 text-7xl font-bold text-emerald-600 tabular-nums leading-none"
              aria-live="polite"
              aria-atomic="true"
            >
              {conversion
                ? formatMoney(animatedReceiverAmount, conversion.receiverCurrency)
                : <span className="text-stone-200">0</span>}
            </p>
            {recipient && (
              <div className="flex items-center shrink-0 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <span className="text-sm font-bold text-emerald-700">
                  {recipient.currency}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 mt-6">
          <p className="text-xs text-stone-500">
            <span className="font-semibold text-stone-700">1.5% fee</span> deducted before conversion.
          </p>
          {parsedAmount > 0 && (
            <p className="text-xs text-stone-500 mt-1">
              Typical providers may charge around{" "}
              <span className="font-semibold text-stone-700">
                {Math.round(parsedAmount * 0.04 * 10) / 10} SAR
              </span>
              ; Hawwil fee is{" "}
              <span className="font-semibold text-emerald-700">{computeFee(parsedAmount)} SAR</span>.
            </p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleContinue}
          disabled={parsedAmount < 1}
          className="flex items-center justify-center w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold py-4 text-base transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
