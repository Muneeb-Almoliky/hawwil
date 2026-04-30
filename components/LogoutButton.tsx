"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    if (!isSupabaseConfigured()) {
      router.push("/");
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-950 transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" />
      Sign out
    </button>
  );
}
