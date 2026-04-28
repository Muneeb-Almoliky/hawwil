"use client";

import { useTransferStore, TRANSFER_STEPS } from "./store";
import { recipients } from "@/data/recipients";
import { FX_RATES } from "@/data/fxRates";
import { BrandHeader } from "@/components/BrandHeader";
import { CheckCircle, Plus } from "lucide-react";

const COUNTRY_FLAGS: Record<string, string> = {
  YE: "🇾🇪",
  JO: "🇯🇴",
  EG: "🇪🇬",
  SY: "🇸🇾",
};

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  "r-ammar-ye":  { bg: "bg-teal-100", text: "text-teal-700" },
  "r-layla-jo":  { bg: "bg-violet-100", text: "text-violet-700" },
  "r-omar-eg":   { bg: "bg-amber-100", text: "text-amber-700" },
  "r-yasmin-sy": { bg: "bg-rose-100", text: "text-rose-700" },
};

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

export function StepRecipient() {
  const recipientId = useTransferStore((s) => s.recipientId);
  const setRecipient = useTransferStore((s) => s.setRecipient);
  const goTo = useTransferStore((s) => s.goTo);

  function handleContinue() {
    goTo(TRANSFER_STEPS.amount);
  }

  return (
    <div className="flex flex-col flex-1 gap-6">
      <BrandHeader showBack backHref="/home" />

      <div className="flex flex-col gap-1">
        <h1
          className="text-3xl font-black text-stone-950 tracking-tight"
          tabIndex={-1}
        >
          Who are you<br />sending to?
        </h1>
        <p className="text-sm text-stone-400">Choose from your saved recipients</p>
      </div>

      <ul className="flex flex-col gap-3 flex-1">
        {recipients.map((r) => {
          const isSelected = recipientId === r.id;
          const colors = AVATAR_COLORS[r.id] ?? { bg: "bg-stone-100", text: "text-stone-600" };
          const rate = FX_RATES[r.currency];

          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setRecipient(r.id)}
                className={[
                  "w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all",
                  isSelected
                    ? "border-emerald-400 bg-emerald-50 shadow-sm ring-1 ring-emerald-400/30"
                    : "border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-md",
                ].join(" ")}
              >
                {/* Avatar with flag badge */}
                <div className="relative shrink-0">
                  <div
                    className={[
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black",
                      colors.bg,
                      colors.text,
                    ].join(" ")}
                  >
                    {getInitials(r.name)}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 text-sm leading-none"
                    aria-hidden="true"
                  >
                    {COUNTRY_FLAGS[r.countryCode]}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={[
                      "text-sm font-bold leading-tight",
                      isSelected ? "text-emerald-900" : "text-stone-950",
                    ].join(" ")}
                  >
                    {r.name}
                  </p>
                  <p
                    className={[
                      "text-xs mt-0.5",
                      isSelected ? "text-emerald-700" : "text-stone-400",
                    ].join(" ")}
                  >
                    {r.country}
                  </p>
                  <p className="text-xs font-semibold text-stone-500 mt-1">
                    1 SAR = {rate} {r.currency}
                  </p>
                </div>

                {/* Selection indicator */}
                {isSelected ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-stone-200 shrink-0" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Add new recipient ghost button */}
      <button
        type="button"
        disabled
        title="Coming in Phase 2"
        className="flex items-center justify-center gap-2 w-full rounded-2xl border border-dashed border-stone-300 text-stone-400 font-semibold py-4 text-sm transition-colors hover:border-emerald-300 hover:text-emerald-600 cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        Add new recipient
      </button>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!recipientId}
          className="flex items-center justify-center w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold py-4 text-base transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
