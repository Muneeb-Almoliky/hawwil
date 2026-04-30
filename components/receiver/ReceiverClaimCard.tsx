"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReceiverClaimCardProps {
  referenceId: string;
  pickupCode?: string;
  isAlreadyPickedUp: boolean;
  isClaimEnabled: boolean;
}

export function ReceiverClaimCard({
  referenceId,
  pickupCode,
  isAlreadyPickedUp,
  isClaimEnabled,
}: ReceiverClaimCardProps) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAlreadyPickedUp || !isClaimEnabled || !pickupCode) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col gap-3">
      <p className="text-sm font-bold text-stone-950">Claim transfer</p>
      <p className="text-xs text-stone-500">
        Confirm cash pickup at the selected branch.
      </p>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);
          setStatusMessage(null);
          try {
            const response = await fetch("/api/receiver/claim", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                referenceId,
                pickupCode,
              }),
            });
            const result = (await response.json()) as { message?: string };
            if (!response.ok) {
              setStatusMessage(result.message ?? "Could not confirm pickup.");
              return;
            }
            setStatusMessage("Pickup confirmed.");
            router.refresh();
          } catch {
            setStatusMessage("Network error while confirming pickup.");
          } finally {
            setIsSubmitting(false);
          }
        }}
        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-2.5 text-sm"
      >
        {isSubmitting ? "Confirming..." : "Confirm pickup"}
      </button>
      {statusMessage && (
        <p className="text-xs text-stone-600">{statusMessage}</p>
      )}
    </div>
  );
}
