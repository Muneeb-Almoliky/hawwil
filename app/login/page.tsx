import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { BrandHeader } from "@/components/BrandHeader";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string; sent?: string }>;
}

function mapAuthError(message: string): string {
  if (message.toLowerCase().includes("rate limit")) {
    return "Email rate limit exceeded. Wait a minute or sign in with password.";
  }
  return message;
}

function sanitizeNextPath(nextPath: string): string {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/home";
  }
  return nextPath;
}

function getRequestOrigin(headerStore: Headers): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  async function signInWithMagicLink(formData: FormData) {
    "use server";

    if (!isSupabaseConfigured()) {
      redirect("/home");
    }

    const email = String(formData.get("email") ?? "").trim();
    const nextPath = sanitizeNextPath(String(formData.get("next") ?? "/home"));
    const headerStore = await headers();
    const origin = getRequestOrigin(headerStore);

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

      const { error } = await supabase.auth.signInWithPassword({
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

      redirect(nextPath);
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
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
            Use your email magic link to access Hawwil.
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Supabase is not configured yet. Set environment variables to enable auth.
          </div>
        )}

        {params.error && (
          <div className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-700">
            {params.error}
          </div>
        )}

        {params.sent === "1" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Magic link sent. Check your inbox to continue.
          </div>
        )}

        <form action={signInWithMagicLink} className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col gap-4">
          <input type="hidden" name="next" value={sanitizeNextPath(params.next ?? "/home")} />
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Password (optional)
            </span>
            <input
              name="password"
              type="password"
              placeholder="Use for seeded demo users"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <button
            type="submit"
            name="mode"
            value="magic"
            className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 transition-colors"
          >
            Send magic link
          </button>

          <button
            type="submit"
            name="mode"
            value="password"
            className="w-full rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-bold py-3.5 transition-colors"
          >
            Sign in with password
          </button>
        </form>
      </div>
    </AppShell>
  );
}
