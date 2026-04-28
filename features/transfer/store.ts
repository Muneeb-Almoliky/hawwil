"use client";

import { create } from "zustand";
import { generateReferenceId } from "@/lib/format";
import { getRecipientById } from "@/data/recipients";
import { currentUser } from "@/data/currentUser";
import { convert } from "@/lib/fx";
import type { TransferRecord } from "@/data/history";

export const TRANSFER_STEPS = {
  recipient: "recipient",
  amount: "amount",
  review: "review",
  success: "success",
} as const;

export type TransferStep =
  (typeof TRANSFER_STEPS)[keyof typeof TRANSFER_STEPS];

interface TransferState {
  step: TransferStep;
  recipientId: string | null;
  amountSar: number;
  referenceId: string | null;
  isConfirming: boolean;
  errorMessage: string | null;
  sessionTransfers: TransferRecord[];
  setRecipient: (id: string) => void;
  setAmount: (sar: number) => void;
  goTo: (step: TransferStep) => void;
  clearError: () => void;
  confirm: () => Promise<void>;
  reset: () => void;
}

export const useTransferStore = create<TransferState>((set, get) => ({
  step: TRANSFER_STEPS.recipient,
  recipientId: null,
  amountSar: 0,
  referenceId: null,
  isConfirming: false,
  errorMessage: null,
  sessionTransfers: [],

  setRecipient: (id) => set({ recipientId: id, errorMessage: null }),

  setAmount: (sar) => set({ amountSar: sar, errorMessage: null }),

  goTo: (step) => set({ step, errorMessage: null }),

  clearError: () => set({ errorMessage: null }),

  confirm: async () => {
    set({ isConfirming: true, errorMessage: null });
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
    const referenceId = generateReferenceId();
    const { recipientId, amountSar, sessionTransfers } = get();
    const recipient = recipientId ? getRecipientById(recipientId) : null;
    if (recipient) {
      const conversion = convert(amountSar, recipient.currency);
      const localRecord: TransferRecord = {
        id: `session-${Date.now()}`,
        referenceId,
        senderName: currentUser.name,
        recipientName: recipient.name,
        recipientCountry: recipient.country,
        amountSar,
        receiverAmount: conversion.receiverAmount,
        receiverCurrency: conversion.receiverCurrency,
        feeSar: conversion.feeSar,
        fxRate: conversion.rate,
        status: "completed",
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await fetch("/api/transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: recipient.id,
            amountSar: conversion.amountSar,
          }),
        });

        if (response.ok) {
          const result = (await response.json()) as { transfer: TransferRecord };
          set({
            isConfirming: false,
            referenceId: result.transfer.referenceId,
            step: TRANSFER_STEPS.success,
            sessionTransfers: [result.transfer, ...sessionTransfers],
          });
          return;
        }

        const errorResult = (await response.json()) as { code?: string; message?: string };
        if (errorResult.code === "SUPABASE_NOT_CONFIGURED") {
          set({
            isConfirming: false,
            referenceId,
            step: TRANSFER_STEPS.success,
            sessionTransfers: [localRecord, ...sessionTransfers],
          });
          return;
        }

        set({
          isConfirming: false,
          errorMessage: errorResult.message ?? "Could not complete transfer. Please retry.",
        });
      } catch {
        set({
          isConfirming: false,
          errorMessage: "Network issue while confirming transfer. Please retry.",
        });
      }
    } else {
      set({ isConfirming: false, referenceId, step: TRANSFER_STEPS.success });
    }
  },

  reset: () =>
    set({
      step: TRANSFER_STEPS.recipient,
      recipientId: null,
      amountSar: 0,
      referenceId: null,
      isConfirming: false,
      errorMessage: null,
    }),
}));
