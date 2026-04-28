import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

export function createServiceClient() {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service environment variables are not configured.");
  }

  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
