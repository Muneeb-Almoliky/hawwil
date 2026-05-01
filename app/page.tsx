import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Zap, ShieldCheck, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { FX_RATES } from "@/data/fxRates";
import { computeFee } from "@/lib/fx";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const CORRIDOR_PREVIEW = [
  { flag: "🇾🇪", to: "Yemen", rate: FX_RATES.YER, currency: "YER", example: 500 },
  { flag: "🇯🇴", to: "Jordan", rate: FX_RATES.JOD, currency: "JOD", example: 500 },
  { flag: "🇪🇬", to: "Egypt", rate: FX_RATES.EGP, currency: "EGP", example: 500 },
  { flag: "🇸🇾", to: "Syria", rate: FX_RATES.SYP, currency: "SYP", example: 500 },
];

const TRUST_ITEMS = [
  { icon: Zap, label: "Instant settlement", sub: "Arrives in seconds" },
  { icon: TrendingDown, label: "Transparent 1.5% fee", sub: "No hidden spreads" },
  { icon: ShieldCheck, label: "Licensed infrastructure", sub: "Regulated payment rails" },
];

export default async function WelcomePage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/home");
    }
  }

  const exampleSar = CORRIDOR_PREVIEW[0].example;
  const corridorCalcs = CORRIDOR_PREVIEW.map((c) => {
    const exampleFee = computeFee(c.example);
    const receives = (c.example - exampleFee) * c.rate;
    return {
      ...c,
      receivesFormatted: receives.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      }),
    };
  });

  return (
    <AppShell showPanel={false}>
      <BrandHeader
        actions={
          <>
            <Link
              href="/login"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 whitespace-nowrap"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-white whitespace-nowrap"
            >
              Get started
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-8 flex-1">
        {/* Hero */}
        <div className="flex flex-col gap-4">
          <h1 className="text-[2.6rem] font-black text-stone-950 leading-[1.1] tracking-tight">
            Send money<br />
            <span className="text-emerald-600">across borders, instantly</span>
          </h1>
          <p className="text-base text-stone-500 leading-relaxed max-w-sm">
            Transparent fees, fixed exchange rates, and instant payouts.
          </p>
        </div>

        {/* Fixed rates — four corridors, compact table */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Fixed rates from SAR
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 shrink-0">
              Fixed · No spread
            </span>
          </div>
          <p className="text-[11px] text-stone-500 leading-snug">
            Same 1.5% fee. “Recipient gets” is for a{" "}
            <span className="font-semibold text-stone-700 tabular-nums">
              {exampleSar.toLocaleString("en-US")} SAR
            </span>{" "}
            send, after fee then FX.
          </p>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-xs text-left border-collapse min-w-[280px]">
              <thead>
                <tr className="text-stone-500 border-b border-stone-200">
                  <th className="py-2 pr-2 font-semibold uppercase tracking-wider w-[40%]">
                    Corridor
                  </th>
                  <th className="py-2 pr-2 font-semibold uppercase tracking-wider tabular-nums">
                    1 SAR
                  </th>
                  <th className="py-2 font-semibold uppercase tracking-wider text-right tabular-nums">
                    Recipient gets
                  </th>
                </tr>
              </thead>
              <tbody>
                {corridorCalcs.map((c) => (
                  <tr
                    key={c.to}
                    className="border-b border-stone-100 last:border-b-0 text-stone-950"
                  >
                    <td className="py-2.5 pr-2 align-middle">
                      <span className="mr-1.5" aria-hidden>
                        {c.flag}
                      </span>
                      <span className="font-semibold">{c.to}</span>
                    </td>
                    <td className="py-2.5 pr-2 align-middle tabular-nums text-stone-600">
                      {c.rate} {c.currency}
                    </td>
                    <td className="py-2.5 align-middle text-right font-bold tabular-nums">
                      {c.receivesFormatted}
                      <span className="text-[10px] font-semibold text-stone-500 ml-1">
                        {c.currency}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust items */}
        <div className="flex flex-col gap-3">
          {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-950 leading-none">{label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 text-base transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          Start transfer
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-xs text-stone-400 mt-3">
          GCC · KYC verified · Instant settlement
        </p>
      </div>
    </AppShell>
  );
}
