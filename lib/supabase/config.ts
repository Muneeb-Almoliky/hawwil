import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(
    getSupabaseUrl() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
