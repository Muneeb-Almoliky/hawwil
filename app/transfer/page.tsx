"use client";

import { useEffect } from "react";
import { useTransferStore, TRANSFER_STEPS } from "@/features/transfer/store";
import { StepRecipient } from "@/features/transfer/StepRecipient";
import { StepAmount } from "@/features/transfer/StepAmount";
import { StepReview } from "@/features/transfer/StepReview";
import { StepSuccess } from "@/features/transfer/StepSuccess";
import { AppShell } from "@/components/AppShell";

const STEP_ORDER = [
  TRANSFER_STEPS.recipient,
  TRANSFER_STEPS.amount,
  TRANSFER_STEPS.review,
  TRANSFER_STEPS.success,
] as const;

const STEPS_WITH_PANEL = new Set<string>([
  TRANSFER_STEPS.recipient,
  TRANSFER_STEPS.amount,
  TRANSFER_STEPS.success,
]);

export default function TransferPage() {
  const step = useTransferStore((s) => s.step);
  const currentIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  const isSuccess = step === TRANSFER_STEPS.success;
  const isRecipientStep = step === TRANSFER_STEPS.recipient;
  const shouldExpandMain = isRecipientStep || step === TRANSFER_STEPS.amount || isSuccess;
  const showPanel = STEPS_WITH_PANEL.has(step);

  useEffect(() => {
    const h1 = document.querySelector<HTMLElement>("main h1[tabindex]");
    h1?.focus();
  }, [step]);

  return (
    <AppShell showPanel={showPanel} expandMain={shouldExpandMain}>
      {/* Step progress indicator (hidden on success) */}
      {!isSuccess && (
        <div
          className="flex gap-1.5 mb-6"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={currentIndex + 1}
        >
          {STEP_ORDER.slice(0, -1).map((s, i) => (
            <div
              key={s}
              className={[
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i < currentIndex
                  ? "bg-emerald-600"
                  : i === currentIndex
                  ? "bg-emerald-400"
                  : "bg-stone-200",
              ].join(" ")}
            />
          ))}
        </div>
      )}

      {/* Animated step content */}
      <div
        key={step}
        className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {step === TRANSFER_STEPS.recipient && <StepRecipient />}
        {step === TRANSFER_STEPS.amount && <StepAmount />}
        {step === TRANSFER_STEPS.review && <StepReview />}
        {step === TRANSFER_STEPS.success && <StepSuccess />}
      </div>
    </AppShell>
  );
}
