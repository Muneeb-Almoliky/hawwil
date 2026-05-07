import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const OTP_TYPES = new Set([
  "signup",
  "email",
  "recovery",
  "invite",
  "email_change",
  "magiclink",
]);

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/home";
  }
  return nextPath;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = sanitizeNextPath(url.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/home", url.origin));
  }

  const code = url.searchParams.get("code");
  if (code) {
    const redirect = new URL("/auth/callback", url.origin);
    redirect.searchParams.set("code", code);
    redirect.searchParams.set("next", next);
    return NextResponse.redirect(redirect);
  }

  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (!token_hash || !type || !OTP_TYPES.has(type)) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("This confirmation link is invalid or has expired.")}`,
        url.origin
      )
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as
      | "signup"
      | "email"
      | "recovery"
      | "invite"
      | "email_change"
      | "magiclink",
    token_hash,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
