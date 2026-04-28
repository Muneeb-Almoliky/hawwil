import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { findTransferByReferenceId } from "@/data/history";
import { formatMoney } from "@/lib/format";
import type { CorridorCurrency } from "@/data/recipients";

interface ReceiverLookupPayload {
  referenceId: string;
  senderName: string;
  recipientName: string;
  recipientCountry: string;
  amountSar: number;
  receiverAmount: number;
  receiverCurrency: CorridorCurrency;
  status: "completed";
  timestamp: string;
}

interface ReceiverLookupPageProps {
  params: Promise<{ referenceId: string }>;
  searchParams: Promise<{ payload?: string }>;
}

function parsePayload(rawPayload: string | undefined): ReceiverLookupPayload | null {
  if (!rawPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawPayload) as ReceiverLookupPayload;
    if (!parsed.referenceId || !parsed.recipientName || !parsed.receiverCurrency) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ReceiverLookupPage({
  params,
  searchParams,
}: ReceiverLookupPageProps) {
  const { referenceId } = await params;
  const resolvedSearchParams = await searchParams;
  const decodedReferenceId = decodeURIComponent(referenceId);
  const payloadRecord = parsePayload(resolvedSearchParams.payload);
  const lookupRecord = findTransferByReferenceId(decodedReferenceId);
  const record = lookupRecord ?? payloadRecord;

  return (
    <AppShell showPanel={false}>
      <BrandHeader />

      <div className="flex flex-col gap-6 flex-1">
        <div>
          <h1 className="text-3xl font-black text-stone-950 tracking-tight">
            Receiver transfer lookup
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Share this page with your recipient to confirm status
          </p>
        </div>

        {!record && (
          <div className="rounded-2xl border border-rose-200 bg-white shadow-sm p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-base font-bold text-stone-950">Transfer not found</p>
            <p className="text-sm text-stone-600">
              We could not find a transfer for reference <span className="font-mono">{decodedReferenceId}</span>.
            </p>
          </div>
        )}

        {record && (
          <>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-white border border-emerald-100 rounded-full px-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </div>
              <p className="text-3xl font-black text-emerald-700 tabular-nums mt-3">
                {formatMoney(record.receiverAmount, record.receiverCurrency)}
                <span className="text-base font-bold ml-1">{record.receiverCurrency}</span>
              </p>
              <p className="text-sm text-emerald-800 mt-1">
                paid out to {record.recipientName} in {record.recipientCountry}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                  Reference ID
                </p>
                <p className="text-sm font-mono font-bold text-stone-950">{record.referenceId}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                  Sent by
                </p>
                <p className="text-sm font-bold text-stone-950">{record.senderName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                  Sender amount
                </p>
                <p className="text-sm font-bold text-stone-950">
                  {formatMoney(record.amountSar, "SAR")} SAR
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
                  Settled at
                </p>
                <p className="text-sm text-stone-700 flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5 text-stone-500" />
                  {formatAbsoluteDate(record.timestamp)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto pt-8">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full rounded-2xl border border-stone-200 bg-white shadow-sm hover:bg-stone-50 text-stone-700 font-bold py-4 text-base transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hawwil
        </Link>
      </div>
    </AppShell>
  );
}
