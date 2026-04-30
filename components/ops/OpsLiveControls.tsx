"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OpsLiveControlsProps {
  pollMs?: number;
}

export function OpsLiveControls({ pollMs = 10000 }: OpsLiveControlsProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("ops-transfers-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transfers" },
          () => {
            router.refresh();
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsRealtimeActive(true);
          }
        });

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {}
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, pollMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [pollMs, router]);

  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
          isRealtimeActive
            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
            : "text-stone-600 bg-stone-100 border border-stone-200",
        ].join(" ")}
      >
        <Activity className="w-3 h-3" />
        {isRealtimeActive ? "Live" : "Polling"}
      </span>

      <button
        type="button"
        onClick={() => {
          setIsRefreshing(true);
          router.refresh();
          window.setTimeout(() => setIsRefreshing(false), 600);
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
      >
        <RefreshCw className={["w-3.5 h-3.5", isRefreshing ? "animate-spin" : ""].join(" ")} />
        Refresh
      </button>
    </div>
  );
}
