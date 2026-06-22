import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { getAppOriginFromHeaders } from "@/lib/get-app-origin";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string; sent?: string; mode?: string }>;
}

function mapAuthError(message: string): string {
  const normalizedMessage = message.toLowerCase();
  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "Too many requests — wait a minute, then try again.";
  }
  // Supabase returns a generic security message when OTP is sent to an
  // unregistered email. Surface something more actionable.
  if (
    normalizedMessage.includes("for security purposes") ||
    normalizedMessage.includes("signups not allowed")
  ) {
    return "No account found for that email. Create one first, or sign in with a password.";
  }
  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid email or password")
  ) {
    return "Incorrect email or password. Double-check and try again.";
  }
  if (normalizedMessage.includes("email not confirmed")) {
    return "Please verify your email before signing in. Check your inbox for the confirmation link.";
  }
  return message;
}

function sanitizeNextPath(nextPath: string): string {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/home";
  }
  return nextPath;
}

function getInitialMode(mode: string | undefined): "magic" | "password" {
  return mode === "magic" ? "magic" : "password";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const nextPath = sanitizeNextPath(params.next ?? "/home");
      if (!isEmailVerified(user)) {
        redirect(`/verify-email?next=${encodeURIComponent(nextPath)}`);
      }
      redirect(nextPath);
    }
  }

  async function signInWithMagicLink(formData: FormData) {
    "use server";

    if (!isSupabaseConfigured()) {
      redirect("/home");
    }

    const email = String(formData.get("email") ?? "").trim();
    const nextPath = sanitizeNextPath(String(formData.get("next") ?? "/home"));
    const headerStore = await headers();
    const origin = getAppOriginFromHeaders(headerStore);

    if (!email) {
      redirect(`/login?error=${encodeURIComponent("Please enter your email.")}`);
    }

    const supabase = await createClient();
    const mode = String(formData.get("mode") ?? "magic");

    if (mode === "password") {
      const password = String(formData.get("password") ?? "");
      if (!password) {
        redirect(
          `/login?error=${encodeURIComponent("Please enter your password.")}&next=${encodeURIComponent(
            nextPath
          )}`
        );
      }

      const { data: passwordData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        redirect(
          `/login?error=${encodeURIComponent(mapAuthError(error.message))}&next=${encodeURIComponent(
            nextPath
          )}`
        );
      }

      // Use the user from the signIn response — no need for a second getUser() call.
      if (passwordData.user && !isEmailVerified(passwordData.user)) {
        redirect(`/verify-email?next=${encodeURIComponent(nextPath)}`);
      }

      redirect(nextPath);
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      redirect(
        `/login?error=${encodeURIComponent(mapAuthError(error.message))}&next=${encodeURIComponent(
          nextPath
        )}`
      );
    }

    redirect(`/login?sent=1&next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <AppShell showPanel={false}>
      <BrandHeader />

      <div className="flex flex-col flex-1 gap-6">
        <div>
          <h1 className="text-3xl font-black text-stone-950 tracking-tight">Sign in</h1>
          <p className="text-sm text-stone-500 mt-1">
            Sign in with your password, or use a magic link if you prefer.
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Supabase is not configured. Set environment variables to enable auth.
          </div>
        )}

        {params.error && (
          <div className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-700">
            {params.error}
          </div>
        )}

        {params.sent === "1" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Magic link sent — check your inbox to continue.
          </div>
        )}

        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5">
          <LoginForm
            action={signInWithMagicLink}
            defaultNext={sanitizeNextPath(params.next ?? "/home")}
            initialMode={getInitialMode(params.mode)}
          />
        </div>

        <p className="text-sm text-stone-600">
          New to Hawwil?{" "}
          <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Create account
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
