"use client";

import { useMemo, useState } from "react";
import type { Recipient } from "@/data/recipients";
import type { ScheduleRecord } from "@/lib/data-access";

interface SchedulesManagerProps {
  recipients: Recipient[];
  initialSchedules: ScheduleRecord[];
}

type ScheduleFrequency = "weekly" | "monthly";
type ScheduleStatus = "active" | "paused" | "cancelled";

function formatDate(isoOrDate: string): string {
  const date = new Date(isoOrDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SchedulesManager({
  recipients,
  initialSchedules,
}: SchedulesManagerProps) {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>(initialSchedules);
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? "");
  const [amountSar, setAmountSar] = useState("100");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("monthly");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeCount = useMemo(
    () => schedules.filter((schedule) => schedule.status === "active").length,
    [schedules]
  );
  const selectedRecipient = useMemo(
    () => recipients.find((recipient) => recipient.id === recipientId) ?? null,
    [recipients, recipientId]
  );
  const amountValue = Number(amountSar);

  async function createSchedule() {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          amountSar: Number(amountSar),
          frequency,
          startDate,
          endDate: endDate || null,
        }),
      });
      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setStatusMessage(result.message ?? "Could not create schedule.");
        return;
      }

      setStatusMessage("Schedule created successfully.");
      window.location.reload();
    } catch {
      setStatusMessage("Network error while creating schedule.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateScheduleStatus(scheduleId: string, status: ScheduleStatus) {
    setIsMutatingId(scheduleId);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/schedules/${encodeURIComponent(scheduleId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setStatusMessage(result.message ?? "Could not update schedule.");
        return;
      }
      setSchedules((current) =>
        current.map((schedule) =>
          schedule.id === scheduleId ? { ...schedule, status } : schedule
        )
      );
      setStatusMessage("Schedule updated.");
    } catch {
      setStatusMessage("Network error while updating schedule.");
    } finally {
      setIsMutatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 flex-1">
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-black text-stone-950">Create schedule</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Automate weekly or monthly remittances.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              Recipient
            </span>
            <select
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            >
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.name} ({recipient.country})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              Amount (SAR)
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={amountSar}
              onChange={(event) => setAmountSar(event.target.value)}
              placeholder="Amount in SAR"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                Frequency
              </span>
              <select
                value={frequency}
                onChange={(event) =>
                  setFrequency(event.target.value as ScheduleFrequency)
                }
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                First transfer date
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              End date (optional)
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <p className="text-xs text-stone-500">
            {selectedRecipient && Number.isFinite(amountValue) && amountValue > 0
              ? `You will send ${amountValue} SAR to ${selectedRecipient.name} (${selectedRecipient.country}) ${frequency}. First run: ${formatDate(startDate)}.`
              : "Choose recipient, amount, and timing to preview schedule details."}
          </p>
          <p className="text-[11px] text-stone-500">
            Runs at 9:00 UTC on each scheduled date.
          </p>
        </div>

        <button
          type="button"
          disabled={isSubmitting || !recipientId || Number(amountSar) <= 0}
          onClick={createSchedule}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold py-2.5 text-sm cursor-pointer"
        >
          {isSubmitting ? "Creating..." : "Create schedule"}
        </button>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-stone-950">Scheduled remittances</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {activeCount} active schedule{activeCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {schedules.length === 0 && (
          <p className="text-sm text-stone-500">
            No schedules yet. Create your first recurring remittance.
          </p>
        )}

        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="rounded-xl border border-stone-200 bg-stone-50 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-stone-950">
                {schedule.recipientName} · {schedule.recipientCountry}
              </p>
              <span
                className={[
                  "text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border",
                  schedule.status === "active"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : schedule.status === "paused"
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-stone-600 bg-white border-stone-200",
                ].join(" ")}
              >
                {schedule.status}
              </span>
            </div>
            <p className="text-sm text-stone-700">
              {schedule.amountSar} SAR · {schedule.frequency}
            </p>
            <p className="text-xs text-stone-500">
              Next run: {formatDate(schedule.nextRunAt)} · Recipient: {schedule.recipientMaskedPhone}
            </p>

            <div className="flex items-center gap-2 pt-1">
              {schedule.status === "paused" && (
                <button
                  type="button"
                  disabled={isMutatingId === schedule.id}
                  onClick={() => updateScheduleStatus(schedule.id, "active")}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-emerald-700 text-xs font-semibold px-2.5 py-1.5 cursor-pointer"
                >
                  Resume
                </button>
              )}
              {schedule.status === "active" && (
                <button
                  type="button"
                  disabled={isMutatingId === schedule.id}
                  onClick={() => updateScheduleStatus(schedule.id, "paused")}
                  className="rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-amber-700 text-xs font-semibold px-2.5 py-1.5 cursor-pointer"
                >
                  Pause
                </button>
              )}
              {schedule.status !== "cancelled" && (
                <button
                  type="button"
                  disabled={isMutatingId === schedule.id}
                  onClick={() => updateScheduleStatus(schedule.id, "cancelled")}
                  className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-rose-700 text-xs font-semibold px-2.5 py-1.5 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {statusMessage && (
        <p className="text-xs text-stone-600">{statusMessage}</p>
      )}
    </div>
  );
}
