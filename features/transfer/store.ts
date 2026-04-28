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
  sessionTransfers: TransferRecord[];
  setRecipient: (id: string) => void;
  setAmount: (sar: number) => void;
  goTo: (step: TransferStep) => void;
  confirm: () => Promise<void>;
  reset: () => void;
}

export const useTransferStore = create<TransferState>((set, get) => ({
  step: TRANSFER_STEPS.recipient,
  recipientId: null,
  amountSar: 0,
  referenceId: null,
  isConfirming: false,
  sessionTransfers: [],

  setRecipient: (id) => set({ recipientId: id }),

  setAmount: (sar) => set({ amountSar: sar }),

  goTo: (step) => set({ step }),

  confirm: async () => {
    set({ isConfirming: true });
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
    const referenceId = generateReferenceId();
    const { recipientId, amountSar, sessionTransfers } = get();
    const recipient = recipientId ? getRecipientById(recipientId) : null;
    if (recipient) {
      const conversion = convert(amountSar, recipient.currency);
      const newRecord: TransferRecord = {
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
      set({
        isConfirming: false,
        referenceId,
        step: TRANSFER_STEPS.success,
        sessionTransfers: [newRecord, ...sessionTransfers],
      });
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
    }),
}));
