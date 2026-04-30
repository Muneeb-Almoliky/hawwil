import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, Clock3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { canAccessOpsHub } from "@/lib/access";
import { formatMoney } from "@/lib/format";
import { getAuthenticatedProfile, getOpsTransfers } from "@/lib/data-access";

function formatPayoutStatus(status: string): string {
  if (status === "recipient_action_required") {
    return "Waiting recipient method";
  }
  if (status === "payout_pending") {
    return "Pending partner payout";
  }
  if (status === "paid_out") {
    return "Paid to recipient";
  }
  if (status === "failed") {
    return "Failed";
  }
  return "Processing";
}

export default async function PartnerMockPage() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    redirect("/login?next=/ops/partner-mock");
  }

  const isAllowed = profile.role === "ops_admin" || canAccessOpsHub({ id: profile.id });
  if (!isAllowed) {
    redirect("/home");
  }

  const records = await getOpsTransfers();

  return (
    <AppShell showPanel={false}>
      <BrandHeader />
      <div className="flex flex-col gap-6 flex-1">
        <div>
          <h1 className="text-3xl font-black text-stone-950 tracking-tight">
            Partner payout agent (mock)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Simulated partner queue fed by Hawwil transfers.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Payout queue
          </p>
          <ul className="flex flex-col gap-2">
            {records.slice(0, 25).map((record) => (
              <li
                key={record.id}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {record.recipientName} · {record.recipientCountry}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {record.referenceId} · {formatPayoutStatus(record.status)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-stone-950">
                    {formatMoney(record.receiverAmount, record.receiverCurrency)} {record.receiverCurrency}
                  </p>
                  <p className="text-[11px] text-stone-600 inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {record.settlementPartner}
                  </p>
                  <p className="text-[11px] text-stone-500 inline-flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    {record.settlementUsdc} USDC
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Link
          href="/ops"
          className="flex items-center justify-center gap-2 w-full rounded-2xl border border-stone-200 bg-white shadow-sm hover:bg-stone-50 text-stone-700 font-bold py-4 text-base transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to operations
        </Link>
      </div>
    </AppShell>
  );
}
