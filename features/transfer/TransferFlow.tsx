"use client";

import { useEffect, useState } from "react";
import { useTransferStore, TRANSFER_STEPS } from "@/features/transfer/store";
import { StepRecipient } from "@/features/transfer/StepRecipient";
import { StepAmount } from "@/features/transfer/StepAmount";
import { StepReview } from "@/features/transfer/StepReview";
import { StepProcessing } from "@/features/transfer/StepProcessing";
import { StepSuccess } from "@/features/transfer/StepSuccess";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import {
  recipients as fallbackRecipients,
  type Recipient,
} from "@/data/recipients";

interface TransferFlowProps {
  sender: {
    name: string;
    country: string;
  };
  initialPeerUserId?: string | null;
}

const STEP_ORDER = [
  TRANSFER_STEPS.recipient,
  TRANSFER_STEPS.amount,
  TRANSFER_STEPS.review,
  TRANSFER_STEPS.processing,
  TRANSFER_STEPS.success,
] as const;

const STEPS_WITH_PANEL = new Set<string>([
  TRANSFER_STEPS.recipient,
  TRANSFER_STEPS.amount,
  TRANSFER_STEPS.success,
]);

export function TransferFlow({ sender, initialPeerUserId = null }: TransferFlowProps) {
  const step = useTransferStore((state) => state.step);
  const recipientId = useTransferStore((state) => state.recipientId);
  const setRecipient = useTransferStore((state) => state.setRecipient);
  const setPeerRecipient = useTransferStore((state) => state.setPeerRecipient);
  const goTo = useTransferStore((state) => state.goTo);
  const reset = useTransferStore((state) => state.reset);
  const currentIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  const isSuccess = step === TRANSFER_STEPS.success || step === TRANSFER_STEPS.processing;
  const isRecipientStep = step === TRANSFER_STEPS.recipient;
  const shouldExpandMain =
    isRecipientStep || step === TRANSFER_STEPS.amount || step === TRANSFER_STEPS.processing || isSuccess;
  const showPanel = STEPS_WITH_PANEL.has(step);

  useEffect(() => {
    if (step === TRANSFER_STEPS.success) {
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [peerDeepLinkError, setPeerDeepLinkError] = useState<string | null>(null);

  useEffect(() => {
    const peerId = initialPeerUserId?.trim();
    if (!peerId) {
      return;
    }
    let cancelled = false;
    async function loadPeerFromLink(id: string) {
      setPeerDeepLinkError(null);
      try {
        const response = await fetch(`/api/users/peer/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          message?: string;
          peer?: { id: string; fullName: string; country: string };
        };
        if (cancelled) {
          return;
        }
        if (!response.ok || !result.peer) {
          setPeerDeepLinkError(result.message ?? "Could not load that Hawwil user.");
          return;
        }
        setPeerRecipient({
          peerUserId: result.peer.id,
          name: result.peer.fullName,
          country: result.peer.country,
        });
      } catch {
        if (!cancelled) {
          setPeerDeepLinkError("Network issue loading that link.");
        }
      }
    }
    void loadPeerFromLink(peerId);
    return () => {
      cancelled = true;
    };
  }, [initialPeerUserId, setPeerRecipient]);

  useEffect(() => {
    let isMounted = true;
    async function fetchRecipients() {
      setIsLoadingRecipients(true);
      setRecipientsError(null);
      try {
        const response = await fetch("/api/recipients", { cache: "no-store" });
        const result = (await response.json()) as {
          code?: string;
          recipients?: Recipient[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(result.message ?? "Could not load recipients.");
        }

        if (result.code === "SUPABASE_NOT_CONFIGURED") {
          if (isMounted) {
            setRecipients(fallbackRecipients);
          }
          return;
        }

        if (isMounted) {
          setRecipients(result.recipients ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setRecipientsError(
            error instanceof Error ? error.message : "Could not load recipients."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingRecipients(false);
        }
      }
    }

    void fetchRecipients();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!recipientId) {
      return;
    }
    const selectedRecipient = recipients.find((recipient) => recipient.id === recipientId);
    if (selectedRecipient) {
      setRecipient(selectedRecipient);
    }
  }, [recipientId, recipients, setRecipient]);

  useEffect(() => {
    const h1 = document.querySelector<HTMLElement>("main h1[tabindex]");
    h1?.focus();
  }, [step]);

  const backHref = step === TRANSFER_STEPS.recipient ? "/home" : undefined;
  const onBack =
    step === TRANSFER_STEPS.amount
      ? () => goTo(TRANSFER_STEPS.recipient)
      : step === TRANSFER_STEPS.review
      ? () => goTo(TRANSFER_STEPS.amount)
      : undefined;
  const showBack =
    step === TRANSFER_STEPS.recipient ||
    step === TRANSFER_STEPS.amount ||
    step === TRANSFER_STEPS.review;

  return (
    <AppShell showPanel={showPanel} expandMain={shouldExpandMain}>
      <BrandHeader
        showBack={showBack}
        backHref={backHref ?? "#"}
        onBack={onBack}
      />

      {!isSuccess && (
        <div
          className="flex gap-1.5 mb-6"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={currentIndex + 1}
        >
          {STEP_ORDER.slice(0, -2).map((stepName, index) => (
            <div
              key={stepName}
              className={[
                "h-1 flex-1 rounded-full transition-colors duration-300",
                index < currentIndex
                  ? "bg-emerald-600"
                  : index === currentIndex
                  ? "bg-emerald-400"
                  : "bg-stone-200",
              ].join(" ")}
            />
          ))}
        </div>
      )}

      <div
        key={step}
        className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {step === TRANSFER_STEPS.recipient && (
          <StepRecipient
            recipients={recipients}
            isLoadingRecipients={isLoadingRecipients}
            recipientsError={recipientsError}
            peerDeepLinkError={peerDeepLinkError}
            onAddRecipient={async (payload) => {
              const response = await fetch("/api/recipients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const result = (await response.json()) as {
                recipient?: Recipient;
                message?: string;
              };
              if (!response.ok || !result.recipient) {
                throw new Error(result.message ?? "Could not add recipient.");
              }
              const newRecipient = result.recipient;
              setRecipients((currentRecipients) => [...currentRecipients, newRecipient]);
            }}
          />
        )}
        {step === TRANSFER_STEPS.amount && <StepAmount />}
        {step === TRANSFER_STEPS.review && (
          <StepReview senderName={sender.name} senderCountry={sender.country} />
        )}
        {step === TRANSFER_STEPS.processing && <StepProcessing />}
        {step === TRANSFER_STEPS.success && <StepSuccess senderName={sender.name} />}
      </div>
    </AppShell>
  );
}
