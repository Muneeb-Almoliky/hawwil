"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppOriginFromHeaders } from "@/lib/get-app-origin";

function mapSignupError(message: string): string {
  const normalizedMessage = message.toLowerCase();
  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "Too many signup attempts. Please wait a minute and try again.";
  }
  if (normalizedMessage.includes("already registered")) {
    return "This email is already registered. Please sign in with your password.";
  }
  return message;
}

export async function signUpAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/home");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const country = String(formData.get("country") ?? "Saudi Arabia");

  if (!fullName || !email || !password) {
    redirect("/signup?error=Please+fill+all+fields.");
  }

  if (password !== confirmPassword) {
    redirect("/signup?error=Passwords+do+not+match.");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password+must+be+at+least+8+characters.");
  }

  const supabase = await createClient();
  const headerStore = await headers();
  const origin = getAppOriginFromHeaders(headerStore);
  const confirmUrl = `${origin}/auth/confirm?next=${encodeURIComponent("/home")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl,
      data: {
        full_name: fullName,
        country,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(mapSignupError(error.message))}`);
  }

  if (data.session) {
    redirect("/home");
  }

  redirect(`/signup?sent=1&email=${encodeURIComponent(email)}`);
}
