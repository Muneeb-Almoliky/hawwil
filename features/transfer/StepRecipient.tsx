"use client";

import { useMemo, useState } from "react";
import { useTransferStore, TRANSFER_STEPS } from "./store";
import { CORRIDORS, type Recipient } from "@/data/recipients";
import { FX_RATES } from "@/data/fxRates";
import { CheckCircle, Loader2, Plus } from "lucide-react";

const COUNTRY_FLAGS: Record<string, string> = {
  YE: "🇾🇪",
  JO: "🇯🇴",
  EG: "🇪🇬",
  SY: "🇸🇾",
};

const COUNTRY_DIAL_CODES: Record<string, string> = {
  Yemen: "+967",
  Jordan: "+962",
  Egypt: "+20",
  Syria: "+963",
};

interface StepRecipientProps {
  recipients: Recipient[];
  isLoadingRecipients: boolean;
  recipientsError: string | null;
  onAddRecipient: (payload: {
    name: string;
    country: string;
    phone: string;
  }) => Promise<void>;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

export function StepRecipient({
  recipients,
  isLoadingRecipients,
  recipientsError,
  onAddRecipient,
}: StepRecipientProps) {
  const recipientId = useTransferStore((s) => s.recipientId);
  const setRecipient = useTransferStore((s) => s.setRecipient);
  const goTo = useTransferStore((s) => s.goTo);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const defaultCountry = CORRIDORS[0]?.country ?? "Yemen";
  const [formState, setFormState] = useState({
    name: "",
    country: defaultCountry,
    phone: COUNTRY_DIAL_CODES[defaultCountry] ?? "",
  });

  const activeError = formError ?? recipientsError;

  const isContinueDisabled = !recipientId || isLoadingRecipients;

  const corridorOptions = useMemo(
    () => CORRIDORS.map((corridor) => corridor.country),
    []
  );

  function handleContinue() {
    goTo(TRANSFER_STEPS.amount);
  }

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div className="flex flex-col gap-1">
        <h1
          className="text-2xl font-black text-stone-950 tracking-tight"
          tabIndex={-1}
        >
          Who are you sending to?
        </h1>
        <p className="text-sm text-stone-400">Choose from your saved recipients</p>
      </div>

      {activeError && (
        <div className="rounded-2xl border border-rose-200 bg-white p-3">
          <p className="text-sm font-semibold text-rose-700">{activeError}</p>
        </div>
      )}

      <ul className="flex flex-col gap-3 flex-1">
        {isLoadingRecipients && (
          <li className="rounded-2xl border border-stone-200 bg-white p-4 flex items-center gap-2 text-stone-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-semibold">Loading recipients...</span>
          </li>
        )}

        {recipients.map((r) => {
          const isSelected = recipientId === r.id;
          const colors = isSelected
            ? { bg: "bg-emerald-50", text: "text-emerald-700" }
            : { bg: "bg-stone-100", text: "text-stone-600" };
          const rate = FX_RATES[r.currency];

          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setRecipient(r)}
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

      {showAddForm && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setFormError(null);
            try {
              await onAddRecipient(formState);
              const resetCountry = corridorOptions[0] ?? "Yemen";
              setFormState({
                name: "",
                country: resetCountry,
                phone: COUNTRY_DIAL_CODES[resetCountry] ?? "",
              });
              setShowAddForm(false);
            } catch (error) {
              if (error instanceof Error) {
                setFormError(error.message);
              } else {
                setFormError("Could not add recipient.");
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4 flex flex-col gap-3"
        >
          <p className="text-sm font-bold text-stone-950">Add new recipient</p>

          <input
            value={formState.name}
            onChange={(event) =>
              setFormState((state) => ({ ...state, name: event.target.value }))
            }
            required
            placeholder="Full name"
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />

          <select
            value={formState.country}
            onChange={(event) => {
              const newCountry = event.target.value;
              const dialCode = COUNTRY_DIAL_CODES[newCountry] ?? "";
              const prevDialCode = COUNTRY_DIAL_CODES[formState.country] ?? "";
              const phoneIsPrefix =
                formState.phone === "" || formState.phone === prevDialCode;
              setFormState((state) => ({
                ...state,
                country: newCountry,
                phone: phoneIsPrefix ? dialCode : state.phone,
              }));
            }}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          >
            {corridorOptions.map((country) => (
              <option key={country} value={country}>
                {country} ({COUNTRY_DIAL_CODES[country]})
              </option>
            ))}
          </select>

          <input
            value={formState.phone}
            onChange={(event) =>
              setFormState((state) => ({ ...state, phone: event.target.value }))
            }
            required
            placeholder={COUNTRY_DIAL_CODES[formState.country] ?? "+xxx"}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold py-2.5"
            >
              {isSubmitting ? "Saving..." : "Save recipient"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-stone-200 bg-white text-stone-700 text-sm font-bold px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <button
        type="button"
        onClick={() => setShowAddForm((value) => !value)}
        className="flex items-center justify-center gap-2 w-full rounded-2xl border border-dashed border-stone-300 text-stone-500 font-semibold py-4 text-sm transition-colors hover:border-emerald-300 hover:text-emerald-600"
      >
        <Plus className="w-4 h-4" />
        {showAddForm ? "Hide recipient form" : "Add new recipient"}
      </button>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleContinue}
          disabled={isContinueDisabled}
          className="flex items-center justify-center w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold py-4 text-base transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
