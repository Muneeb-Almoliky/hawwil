import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import {
  getAuthenticatedProfile,
  getUserRecipientsForScheduling,
  getUserSchedules,
} from "@/lib/data-access";
import { SchedulesManager } from "@/features/schedules/SchedulesManager";

export default async function SchedulesPage() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    redirect("/login?next=/schedules");
  }

  const [recipients, schedules] = await Promise.all([
    getUserRecipientsForScheduling(),
    getUserSchedules(),
  ]);

  return (
    <AppShell showPanel={false} expandMain>
      <BrandHeader />

      <div className="flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-1">
          <h1
            className="text-3xl font-black text-stone-950 tracking-tight"
            tabIndex={-1}
          >
            Scheduled remittances
          </h1>
          <p className="text-sm text-stone-500">
            Plan recurring transfers to trusted recipients.
          </p>
        </div>

        {recipients.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5">
            <p className="text-sm text-stone-700">
              Add at least one recipient before creating a schedule.
            </p>
          </div>
        ) : (
          <SchedulesManager recipients={recipients} initialSchedules={schedules} />
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
