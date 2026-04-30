import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { FX_RATES } from "@/data/fxRates";
import { computeFee } from "@/lib/fx";

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

export default function WelcomePage() {
  const featured = CORRIDOR_PREVIEW[0];
  const exampleFee = computeFee(featured.example);
  const receives = ((featured.example - exampleFee) * featured.rate).toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <AppShell showPanel={false}>
      <BrandHeader
        actions={
          <>
            <Link
              href="/login"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Get started
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-10 flex-1">
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

        {/* Live rate card — Wise-style hero */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Featured corridor rate
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
              Fixed · No spread
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-stone-500 mb-0.5">You send</p>
                <p className="text-3xl font-black text-stone-950 tabular-nums">
                  {featured.example.toLocaleString("en-US")}
                  <span className="text-lg font-bold text-stone-400 ml-1.5">SAR</span>
                </p>
              </div>
            </div>

            <div className="h-px bg-stone-100 relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                1 SAR = {featured.rate} {featured.currency}
              </span>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-0.5">Recipient gets</p>
              <p className="text-3xl font-black text-emerald-600 tabular-nums">
                {receives}
                <span className="text-lg font-bold text-emerald-400 ml-1.5">{featured.currency}</span>
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {featured.example - exampleFee} SAR converted · {exampleFee} SAR fee (1.5%)
              </p>
            </div>
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
