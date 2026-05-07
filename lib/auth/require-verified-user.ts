import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { createClient } from "@/lib/supabase/server";

export { isEmailVerified } from "@/lib/auth/email-verification";

export async function requireVerifiedUser(): Promise<
  | { user: User; supabase: Awaited<ReturnType<typeof createClient>> }
  | { response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json(
        { code: "UNAUTHORIZED", message: "Please sign in again." },
        { status: 401 }
      ),
    };
  }

  if (!isEmailVerified(user)) {
    return {
      response: NextResponse.json(
        {
          code: "EMAIL_NOT_VERIFIED",
          message: "Verify your email to continue.",
        },
        { status: 403 }
      ),
    };
  }

  return { user, supabase };
}
