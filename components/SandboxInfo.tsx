import { CheckCircle } from "lucide-react";

const TRUST_BULLETS = [
  "Identity verified",
  "Fixed FX rate · no spread",
  "Instant settlement",
  "Pre-funded liquidity",
  "Receiver SMS + local payout partner",
];

export function SandboxInfo() {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-3">
        Hawwil guarantees
      </p>
      <ul className="space-y-1.5">
        {TRUST_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="text-xs text-emerald-800">{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
