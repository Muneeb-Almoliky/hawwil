import Link from "next/link";
import { redirect } from "next/navigation";
import { SendHorizonal, History, CheckCircle, ArrowUpRight, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { LogoutButton } from "@/components/LogoutButton";
import { formatMoney } from "@/lib/format";
import type { CorridorCurrency } from "@/data/recipients";
import {
  getAuthenticatedProfile,
  getUserTransfers,
} from "@/lib/data-access";
import { ReceivePeerQrCard } from "@/components/ReceivePeerQrCard";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

export default async function HomePage() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    redirect("/login?next=/home");
  }

  const recentTransfers = await getUserTransfers(2);

  return (
    <AppShell showPanel={false}>
      <BrandHeader actions={<LogoutButton />} />

      <div className="flex flex-col gap-8 flex-1">
        {/* Greeting */}
        <div className="flex flex-col gap-1">
          <p className="text-sm text-stone-400">Welcome back</p>
          <h1 className="text-2xl font-black text-stone-950 tracking-tight flex items-center gap-2">
            {profile.name}
            {profile.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                <CheckCircle className="w-2.5 h-2.5" />
                Verified
              </span>
            )}
          </h1>
        </div>

        {/* Balance card — Revolut style */}
        <div className="rounded-2xl bg-emerald-600 p-6 shadow-md relative overflow-hidden">
          {/* decorative ring */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -right-4 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200 mb-3">
              Available balance
            </p>
            <p className="text-4xl font-black text-white tabular-nums leading-none">
              {formatMoney(profile.balanceSar, "SAR")}
              <span className="text-xl font-bold text-emerald-300 ml-2">SAR</span>
            </p>
            <p className="text-xs text-emerald-300 mt-2">
              {profile.country} · Balance in SAR
            </p>
            <p className="text-[10px] text-emerald-200/90 mt-1 max-w-md leading-relaxed">
              More wallet and currency options are planned for a future update.
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Quick actions
          </p>

          {/* Send money — featured primary action */}
          <Link
            href="/transfer"
            className="flex items-center gap-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 p-5 transition-all shadow-sm hover:shadow-md active:scale-[0.98] group"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <SendHorizonal className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-black text-white">Send money</p>
              <p className="text-sm text-emerald-200 mt-0.5">To your saved recipients</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors shrink-0" />
          </Link>

          {/* History — secondary action */}
          <Link
            href="/history"
            className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-md p-4 transition-all group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-stone-200 flex items-center justify-center transition-colors shrink-0">
              <History className="w-4 h-4 text-stone-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-stone-950">Transfer history</p>
              <p className="text-xs text-stone-400 mt-0.5">View past transfers</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
          </Link>

          <Link
            href="/schedules"
            className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-md p-4 transition-all group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-stone-200 flex items-center justify-center transition-colors shrink-0">
              <CalendarClock className="w-4 h-4 text-stone-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-stone-950">Scheduled remittances</p>
              <p className="text-xs text-stone-400 mt-0.5">Set weekly or monthly sends</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
          </Link>

        </div>

        {(isSupabaseConfigured() || recentTransfers.length > 0) && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5 flex flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Activity
            </p>

            {isSupabaseConfigured() ? (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Receive
                </p>
                <ReceivePeerQrCard hawwilUserId={profile.id} variant="embedded" />
              </div>
            ) : null}

            {recentTransfers.length > 0 ? (
              <div
                className={
                  isSupabaseConfigured()
                    ? "flex flex-col gap-3 border-t border-stone-200 pt-5"
                    : "flex flex-col gap-3"
                }
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    Recent
                  </p>
                  <Link
                    href="/history"
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                  >
                    See all <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {recentTransfers.map((record) => {
                    const countryCode = COUNTRY_CODES[record.recipientCountry] ?? "YE";
                    const flag = COUNTRY_FLAGS[countryCode];
                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-lg shrink-0">
                          {flag}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-950 truncate">
                            {record.recipientName}
                          </p>
                          <p className="text-xs text-stone-400">{record.referenceId}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-stone-950">
                            {formatMoney(record.amountSar, "SAR")} SAR
                          </p>
                          <p className="text-xs text-stone-400">
                            {formatMoney(
                              record.receiverAmount,
                              record.receiverCurrency as CorridorCurrency
                            )}{" "}
                            {record.receiverCurrency}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
