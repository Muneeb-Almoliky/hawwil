"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export function createClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createBrowserClient(
    supabaseUrl,
    supabasePublishableKey
  );
}
