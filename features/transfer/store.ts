"use client";

import { create } from "zustand";
import { generateReferenceId } from "@/lib/format";
import { currentUser } from "@/data/currentUser";
import { convert } from "@/lib/fx";
import type { TransferRecord } from "@/data/history";
import type { Recipient } from "@/data/recipients";

export const TRANSFER_STEPS = {
  recipient: "recipient",
  amount: "amount",
  review: "review",
  processing: "processing",
  success: "success",
} as const;

export type TransferStep =
  (typeof TRANSFER_STEPS)[keyof typeof TRANSFER_STEPS];

interface TransferState {
  step: TransferStep;
  recipientId: string | null;
  recipient: Recipient | null;
  amountSar: number;
  referenceId: string | null;
  isConfirming: boolean;
  isFinalizing: boolean;
  requiresServerFinalize: boolean;
  errorMessage: string | null;
  sessionTransfers: TransferRecord[];
  setRecipient: (recipient: Recipient) => void;
  setAmount: (sar: number) => void;
  goTo: (step: TransferStep) => void;
  clearError: () => void;
  confirm: () => Promise<void>;
  finalizeTransfer: () => Promise<void>;
  reset: () => void;
}

export const useTransferStore = create<TransferState>((set, get) => ({
  step: TRANSFER_STEPS.recipient,
  recipientId: null,
  recipient: null,
  amountSar: 0,
  referenceId: null,
  isConfirming: false,
  isFinalizing: false,
  requiresServerFinalize: false,
  errorMessage: null,
  sessionTransfers: [],

  setRecipient: (recipient) =>
    set({ recipientId: recipient.id, recipient, errorMessage: null }),

  setAmount: (sar) => set({ amountSar: sar, errorMessage: null }),

  goTo: (step) => set({ step, errorMessage: null }),

  clearError: () => set({ errorMessage: null }),

  confirm: async () => {
    set({ isConfirming: true, errorMessage: null });
    const fallbackReferenceId = generateReferenceId();
    const {
      recipient,
      amountSar,
      sessionTransfers,
    } = get();
    if (recipient) {
      const conversion = convert(amountSar, recipient.currency);
      const localRecord: TransferRecord = {
        id: `session-${Date.now()}`,
        referenceId: fallbackReferenceId,
        senderName: currentUser.name,
        recipientName: recipient.name,
        recipientCountry: recipient.country,
        amountSar,
        receiverAmount: conversion.receiverAmount,
        receiverCurrency: conversion.receiverCurrency,
        feeSar: conversion.feeSar,
        fxRate: conversion.rate,
        transferPurpose: "standard",
        payoutMethod: undefined,
        settlementRail: "usdc_settlement",
        settlementUsdc: Math.round((conversion.amountSar / 3.75) * 100) / 100,
        settlementPartner: `${recipient.country} Payout Network`,
        routeReason: "USDC settlement selected for partner settlement.",
        notificationChannels: ["sms", "whatsapp"],
        notificationStatus: "mocked",
        notificationNote: "Local demo transfer; notification mocked.",
        recipientMaskedPhone: recipient.maskedPhone,
        pickupCode: Math.floor(100000 + Math.random() * 900000).toString(),
        status: "recipient_action_required",
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
            isFinalizing: false,
            requiresServerFinalize: true,
            referenceId: result.transfer.referenceId,
            step: TRANSFER_STEPS.processing,
            sessionTransfers: [result.transfer, ...sessionTransfers],
          });
          return;
        }

        const errorResult = (await response.json()) as { code?: string; message?: string };
        if (errorResult.code === "SUPABASE_NOT_CONFIGURED") {
          set({
            isConfirming: false,
            isFinalizing: false,
            requiresServerFinalize: false,
            referenceId: fallbackReferenceId,
            step: TRANSFER_STEPS.processing,
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
      set({
        isConfirming: false,
        isFinalizing: false,
        requiresServerFinalize: false,
        referenceId: fallbackReferenceId,
        step: TRANSFER_STEPS.processing,
      });
    }
  },

  finalizeTransfer: async () => {
    const { referenceId, requiresServerFinalize, sessionTransfers } = get();
    if (!referenceId) {
      set({ step: TRANSFER_STEPS.success });
      return;
    }

    set({ isFinalizing: true, errorMessage: null });

    if (!requiresServerFinalize) {
      set({ isFinalizing: false, step: TRANSFER_STEPS.success });
      return;
    }

    try {
      const response = await fetch(`/api/transfers/${encodeURIComponent(referenceId)}/complete`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const errorResult = (await response.json()) as { message?: string };
        set({
          isFinalizing: false,
          errorMessage: errorResult.message ?? "Could not finalize transfer. Please retry.",
          step: TRANSFER_STEPS.review,
        });
        return;
      }

      const result = (await response.json()) as { transfer: TransferRecord };
      const nextTransfers = sessionTransfers.map((transfer) => {
        if (transfer.referenceId !== result.transfer.referenceId) {
          return transfer;
        }
        return {
          ...result.transfer,
          notificationChannels: result.transfer.notificationChannels ?? transfer.notificationChannels,
          notificationStatus: result.transfer.notificationStatus ?? transfer.notificationStatus,
          notificationNote: result.transfer.notificationNote ?? transfer.notificationNote,
          recipientMaskedPhone: result.transfer.recipientMaskedPhone ?? transfer.recipientMaskedPhone,
        };
      });

      set({
        isFinalizing: false,
        requiresServerFinalize: false,
        sessionTransfers: nextTransfers,
        step: TRANSFER_STEPS.success,
      });
    } catch {
      set({
        isFinalizing: false,
        errorMessage: "Network issue while finalizing transfer. Please retry.",
        step: TRANSFER_STEPS.review,
      });
    }
  },

  reset: () =>
    set({
      step: TRANSFER_STEPS.recipient,
      recipientId: null,
      recipient: null,
      amountSar: 0,
      referenceId: null,
      isConfirming: false,
      isFinalizing: false,
      requiresServerFinalize: false,
      errorMessage: null,
    }),
}));
