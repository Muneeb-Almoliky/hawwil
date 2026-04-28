"use client";

import Link from "next/link";
import { Activity, ArrowLeft, Globe, Lock, ShieldCheck, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { transferHistory } from "@/data/history";
import { currentUser } from "@/data/currentUser";
import { useTransferStore } from "@/features/transfer/store";
import { formatMoney } from "@/lib/format";
import { canAccessOpsHub } from "@/lib/access";
import type { CorridorCurrency } from "@/data/recipients";

const COUNTRY_FLAGS: Record<string, string> = {
  Yemen: "🇾🇪",
  Jordan: "🇯🇴",
  Egypt: "🇪🇬",
  Syria: "🇸🇾",
};

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function HubStats({ records }: { records: ReturnType<typeof transferHistory.slice> }) {
  const totalVolume = records.reduce((sum, record) => sum + record.amountSar, 0);
  const avgTicket = records.length > 0 ? Math.round(totalVolume / records.length) : 0;
  const corridorSpread = new Set(records.map((record) => record.recipientCountry)).size;
  const lastHourTransfers = records.filter((record) => {
    const age = Date.now() - new Date(record.timestamp).getTime();
    return age <= 60 * 60 * 1000;
  }).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-black text-stone-950 tracking-tight">Ops metrics</h2>
        <p className="text-xs text-stone-400 mt-0.5">Internal monitoring only</p>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-emerald-700" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Total volume
          </p>
          <p className="text-xl font-black text-stone-950 tabular-nums">
            {formatMoney(totalVolume, "SAR")}
            <span className="text-xs font-bold text-stone-400 ml-1">SAR</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5 text-teal-700" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Active corridors
          </p>
          <p className="text-xl font-black text-stone-950">{corridorSpread}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Last hour
          </p>
          <p className="text-xl font-black text-stone-950">
            {lastHourTransfers} transfer{lastHourTransfers === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
          Average ticket
        </p>
        <p className="text-lg font-black text-stone-950 tabular-nums">
          {formatMoney(avgTicket, "SAR")}
          <span className="text-xs font-bold text-stone-400 ml-1">SAR</span>
        </p>
      </div>
    </div>
  );
}

export default function OpsPage() {
  const sessionTransfers = useTransferStore((state) => state.sessionTransfers);
  const records = [...sessionTransfers, ...transferHistory].sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
  const isAllowed = canAccessOpsHub(currentUser);

  return (
    <AppShell showPanel={false} rightContent={isAllowed ? <HubStats records={records} /> : undefined} expandMain>
      <BrandHeader />

      {!isAllowed && (
        <div className="flex flex-col flex-1 justify-center">
          <div className="rounded-2xl border border-rose-200 bg-white shadow-sm p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-rose-600" />
            </div>
            <h1 className="text-2xl font-black text-stone-950 tracking-tight">Access denied</h1>
            <p className="text-sm text-stone-600">
              This operations console is restricted to admin users only.
            </p>
          </div>
        </div>
      )}

      {isAllowed && (
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-stone-950 tracking-tight">Operations console</h1>
              <p className="text-sm text-stone-500 mt-1">Internal monitor for hackathon transactions</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              <ShieldCheck className="w-3 h-3" />
              Internal
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {records.map((record) => (
              <li
                key={record.id}
                className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-xl shrink-0">
                  {COUNTRY_FLAGS[record.recipientCountry] ?? "🌍"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-950 truncate">
                    {record.senderName} to {record.recipientName}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {record.referenceId} · {record.recipientCountry}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-stone-950 tabular-nums">
                    {formatMoney(record.amountSar, "SAR")} SAR
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold">
                    {formatMoney(record.receiverAmount, record.receiverCurrency as CorridorCurrency)}{" "}
                    {record.receiverCurrency}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">{formatRelativeDate(record.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-8">
        <Link
          href="/home"
          className="flex items-center justify-center gap-2 w-full rounded-2xl border border-stone-200 bg-white shadow-sm hover:bg-stone-50 text-stone-700 font-bold py-4 text-base transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </AppShell>
  );
}
