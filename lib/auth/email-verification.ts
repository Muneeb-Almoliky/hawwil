import type { User } from "@supabase/supabase-js";

export function isEmailVerified(user: User): boolean {
  if (process.env.AUTH_SKIP_EMAIL_VERIFICATION === "1") {
    return true;
  }
  return Boolean(user.email_confirmed_at);
}
