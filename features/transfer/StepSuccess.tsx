"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTransferStore } from "./store";
import { convert } from "@/lib/fx";
import { formatMoney } from "@/lib/format";
import { CheckCircle, Copy, Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { QrCodeBlock } from "@/components/QrCodeBlock";
import { TransferReceiptDownload } from "@/components/TransferReceiptDownload";

interface StepSuccessProps {
  senderName: string;
}

export function StepSuccess({ senderName }: StepSuccessProps) {
  const recipient = useTransferStore((s) => s.recipient);
  const transferKind = useTransferStore((s) => s.transferKind);
  const amountSar = useTransferStore((s) => s.amountSar);
  const referenceId = useTransferStore((s) => s.referenceId);
  const sessionTransfers = useTransferStore((s) => s.sessionTransfers);
  const reset = useTransferStore((s) => s.reset);

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [receiverShareUrl, setReceiverShareUrl] = useState("");

  const activeTransfer = sessionTransfers.find(
    (transfer) => transfer.referenceId === referenceId
  );
  const persistedTransfer =
    activeTransfer && !activeTransfer.id.startsWith("session-") ? activeTransfer : null;
  const conversion =
    recipient && amountSar > 0
      ? transferKind === "hawwil_peer"
        ? convert(amountSar, "SAR", { feeSar: 0 })
        : convert(amountSar, recipient.currency)
      : null;

  function getReceiverLookupPath(): string | null {
    if (transferKind === "hawwil_peer" || !referenceId || !recipient || !conversion) {
      return null;
    }

    const payload = JSON.stringify({
      referenceId,
      senderName,
      recipientName: recipient.name,
      recipientCountry: recipient.country,
      amountSar: conversion.amountSar,
      receiverAmount: conversion.receiverAmount,
      receiverCurrency: conversion.receiverCurrency,
      transferPurpose: "standard",
      payoutMethod: activeTransfer?.payoutMethod,
      settlementRail: activeTransfer?.settlementRail ?? "usdc_settlement",
      settlementUsdc: activeTransfer?.settlementUsdc ?? 0,
      settlementPartner: activeTransfer?.settlementPartner ?? "Destination Payout Network",
      routeReason: activeTransfer?.routeReason ?? "Settlement route selected by transfer engine.",
      pickupCode: activeTransfer?.pickupCode,
      status: "recipient_action_required",
      timestamp: activeTransfer?.timestamp ?? "",
    });

    return `/r/${encodeURIComponent(referenceId)}?payload=${encodeURIComponent(payload)}`;
  }

  function getReceiverQrPath(): string | null {
    if (transferKind === "hawwil_peer" || !referenceId) {
      return null;
    }
    return `/r/${encodeURIComponent(referenceId)}`;
  }

  async function handleCopyReceiverLink() {
    const lookupPath = getReceiverLookupPath();
    if (!lookupPath) return;

    const absoluteUrl = `${window.location.origin}${lookupPath}`;
    await navigator.clipboard.writeText(absoluteUrl);
    setLinkCopied(true);
    toast.success("Share link copied");
    setTimeout(() => setLinkCopied(false), 2000);
  }

  const receiverLookupPath = getReceiverLookupPath();
  const receiverQrPath = getReceiverQrPath();

  useEffect(() => {
    if (!receiverQrPath) {
      setReceiverShareUrl("");
      return;
    }
    setReceiverShareUrl(`${window.location.origin}${receiverQrPath}`);
  }, [receiverQrPath]);

  async function handleCopy() {
    if (!referenceId) return;
    await navigator.clipboard.writeText(referenceId);
    setCopied(true);
    toast.success("Reference copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col flex-1 gap-6">
      {/* Success hero — big and celebratory */}
      <div className="rounded-2xl bg-emerald-600 p-8 flex flex-col items-center text-center gap-4 shadow-md relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-white" />
        </div>

        <div className="relative flex flex-col gap-1">
          <h1 className="text-xl font-bold text-white" tabIndex={-1}>
            Transfer sent!
          </h1>
          {conversion && recipient && (
            <>
              <p className="text-4xl font-black text-white tabular-nums leading-none mt-1">
                {formatMoney(conversion.receiverAmount, conversion.receiverCurrency)}
                <span className="text-xl font-bold text-emerald-200 ml-2">
                  {conversion.receiverCurrency}
                </span>
              </p>
              <p className="text-emerald-200 text-sm mt-1">
                arrived to {recipient.name}
              </p>
            </>
          )}
        </div>

        <div className="relative flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
          <Zap className="w-3 h-3 text-emerald-200 fill-emerald-200" />
          <span className="text-xs font-bold text-white">Arrived instantly</span>
        </div>
      </div>

      {/* Receipt details */}
      <div className="flex flex-col gap-3 flex-1">
        {/* Reference ID */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
            Reference ID
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-mono font-bold text-stone-950">
              {referenceId}
            </p>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy reference ID"
                className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-950 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy ID
                  </>
                )}
              </button>

              {referenceId && persistedTransfer ? (
                <TransferReceiptDownload referenceId={referenceId} />
              ) : null}

              {receiverLookupPath && (
              <button
                type="button"
                onClick={handleCopyReceiverLink}
                aria-label="Copy receiver lookup link"
                className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Link copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Share link
                  </>
                )}
              </button>
              )}
            </div>
          </div>
          {receiverLookupPath && (
            <p className="text-xs text-stone-500 mt-2">
              Public receiver page:{" "}
              <Link href={receiverLookupPath} className="font-semibold text-emerald-700 hover:text-emerald-800">
                open lookup
              </Link>
            </p>
          )}
          {receiverShareUrl ? (
            <div className="mt-4 flex justify-center">
              <QrCodeBlock
                value={receiverShareUrl}
                caption="Recipient can scan to open the public receiver page"
              />
            </div>
          ) : null}
        </div>

        {/* Summary row */}
        {conversion && (
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                You sent
              </p>
              <p className="text-sm font-bold text-stone-950">
                {formatMoney(conversion.amountSar, "SAR")} SAR
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                Arrival
              </p>
              <p className="text-sm font-bold text-emerald-600">Instant</p>
            </div>
            {transferKind === "international" && (
              <>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                    Fee paid
                  </p>
                  <p className="text-sm font-bold text-stone-950">{conversion.feeSar} SAR</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                    Rate
                  </p>
                  <p className="text-sm font-bold text-stone-950">
                    1 SAR = {conversion.rate} {conversion.receiverCurrency}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                    Recipient step
                  </p>
                  <p className="text-sm font-bold text-stone-950">
                    Recipient selects payout method
                  </p>
                </div>
              </>
            )}
            {transferKind === "hawwil_peer" && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                  Transfer type
                </p>
                <p className="text-sm font-bold text-stone-950">
                  Hawwil balance (no payout link)
                </p>
              </div>
            )}
            {activeTransfer?.senderNote ? (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                  Your note
                </p>
                <p className="text-sm font-bold text-stone-950">{activeTransfer.senderNote}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* SMS notification line */}
        {recipient && transferKind === "international" && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-800 leading-relaxed">
              {(activeTransfer?.notificationStatus ?? "mocked") === "sent"
                ? `${recipient.name} was notified successfully.`
                : (activeTransfer?.notificationStatus ?? "mocked") === "partial"
                ? `Notification was sent partially. ${recipient.name} may need a retry.`
                : (activeTransfer?.notificationStatus ?? "mocked") === "failed"
                ? `Notification failed. Please ask ${recipient.name} to use the receiver lookup link.`
                : `${recipient.name} can use the receiver lookup link to continue.`}
            </p>
          </div>
        )}
        {recipient && transferKind === "hawwil_peer" && (
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-xs text-teal-800 leading-relaxed">
              {`${recipient.name}'s Hawwil SAR balance was updated. They can confirm their new balance on the home screen.`}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Link
          href="/history"
          className="flex items-center justify-center w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 text-base transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          View history
        </Link>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center w-full rounded-2xl border border-stone-200 bg-white shadow-sm hover:bg-stone-50 text-stone-700 font-bold py-4 text-base transition-all active:scale-[0.98]"
        >
          Send another transfer
        </button>
      </div>
    </div>
  );
}
