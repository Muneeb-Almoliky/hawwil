import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle, TrendingUp, Send, Globe, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { formatMoney } from "@/lib/format";
import { formatPayoutDetailsSummary, formatPayoutMethod } from "@/lib/payout";
import type { CorridorCurrency } from "@/data/recipients";
import { getAuthenticatedProfile, getUserTransfers } from "@/lib/data-access";

const PAGE_SIZE = 10;

const COUNTRY_FLAGS: Record<string, string> = {
  YE: "🇾🇪",
  JO: "🇯🇴",
  EG: "🇪🇬",
  SY: "🇸🇾",
};

const COUNTRY_CODES: Record<string, string> = {
  Yemen: "YE",
  Jordan: "JO",
  Egypt: "EG",
  Syria: "SY",
};

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function HistoryStats({ records }: { records: Awaited<ReturnType<typeof getUserTransfers>> }) {
  const now = new Date();
  const thisMonthRecords = records.filter((r) => {
    const d = new Date(r.timestamp);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const totalSent = thisMonthRecords.reduce((sum, r) => sum + r.amountSar, 0);
  const countryCounts = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.recipientCountry] = (acc[r.recipientCountry] ?? 0) + 1;
    return acc;
  }, {});
  const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const avgTransfer = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + r.amountSar, 0) / records.length)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-black text-stone-950 tracking-tight">Your activity</h2>
        <p className="text-xs text-stone-400 mt-0.5">This month</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Total sent this month</p>
            <p className="text-xl font-black text-stone-950 tabular-nums">
              {formatMoney(totalSent, "SAR")}
              <span className="text-xs font-bold text-stone-400 ml-1">SAR</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Average transfer</p>
            <p className="text-xl font-black text-stone-950 tabular-nums">
              {formatMoney(avgTransfer, "SAR")}
              <span className="text-xs font-bold text-stone-400 ml-1">SAR</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Top destination</p>
            <p className="text-base font-black text-stone-950">{topCountry}</p>
            <p className="text-xs text-stone-400">{records.length} transfer{records.length !== 1 ? "s" : ""} total</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HistoryPageProps {
  searchParams: Promise<{ all?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    redirect("/login?next=/history");
  }

  const params = await searchParams;
  const showAll = params.all === "1";
  const records = await getUserTransfers(showAll ? undefined : PAGE_SIZE + 1);
  const hasMore = !showAll && records.length > PAGE_SIZE;
  const visibleRecords = showAll ? records : records.slice(0, PAGE_SIZE);

  return (
    <AppShell showPanel={false} rightContent={<HistoryStats records={visibleRecords} />} expandMain>
      <BrandHeader />

      <div className="flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-1">
          <h1
            className="text-3xl font-black text-stone-950 tracking-tight"
            tabIndex={-1}
          >
            Transfer history
          </h1>
          <p className="text-sm text-stone-400">Your recent transactions</p>
        </div>

        <ul className="flex flex-col gap-3">
          {visibleRecords.map((record) => {
            const countryCode = COUNTRY_CODES[record.recipientCountry] ?? "YE";
            const flag = COUNTRY_FLAGS[countryCode];
            const isSession = record.id.startsWith("session-");
            const payoutDetailsSummary = formatPayoutDetailsSummary(
              record.payoutMethod,
              record.payoutDetails
            );

            return (
              <li
                key={record.id}
                className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-xl shrink-0">
                  {flag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-stone-950 truncate">
                      To {record.recipientName}
                    </p>
                    {isSession && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                        Just now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">
                    {record.recipientCountry} · {record.referenceId}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {formatPayoutMethod(record.payoutMethod)}
                  </p>
                  {payoutDetailsSummary && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      {payoutDetailsSummary}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-stone-950 tabular-nums">
                    {formatMoney(record.amountSar, "SAR")} SAR
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                    <CheckCircle className="w-3 h-3" />
                    {formatRelativeDate(record.timestamp)}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5 tabular-nums">
                    {formatMoney(
                      record.receiverAmount,
                      record.receiverCurrency as CorridorCurrency
                    )}{" "}
                    {record.receiverCurrency}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {hasMore && (
          <Link
            href="/history?all=1"
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-stone-200 bg-white shadow-sm hover:bg-stone-50 text-stone-700 font-semibold py-3 text-sm transition-all active:scale-[0.98]"
          >
            <ChevronDown className="w-4 h-4" />
            Show all transfers
          </Link>
        )}
      </div>

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
