import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>;
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

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      redirect("/home");
    }
  }

  async function signUpAction(formData: FormData) {
    "use server";

    if (!isSupabaseConfigured()) {
      redirect("/home");
    }

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const country = String(formData.get("country") ?? "Saudi Arabia");

    if (!fullName || !email || !password) {
      redirect("/signup?error=Please+fill+all+fields.");
    }

    if (password !== confirmPassword) {
      redirect("/signup?error=Passwords+do+not+match.");
    }

    const supabase = await createClient();
    const headerStore = await headers();
    const origin = getRequestOrigin(headerStore);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/home")}`,
        data: {
          full_name: fullName,
          country,
        },
      },
    });

    if (error) {
      redirect(`/signup?error=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      redirect("/home");
    }

    redirect("/login?sent=1&next=/home");
  }

  return (
    <AppShell showPanel={false}>
      <BrandHeader />

      <div className="flex flex-col flex-1 gap-6">
        <div>
          <h1 className="text-3xl font-black text-stone-950 tracking-tight">Create account</h1>
          <p className="text-sm text-stone-500 mt-1">
            Start sending with your pre-verified Hawwil account.
          </p>
        </div>

        {params.error && (
          <div className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-700">
            {params.error}
          </div>
        )}

        <form
          action={signUpAction}
          className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Full name
            </span>
            <input
              name="fullName"
              type="text"
              required
              placeholder="Your full name"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

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
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Confirm password
            </span>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="Repeat your password"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Country
            </span>
            <select
              name="country"
              defaultValue="Saudi Arabia"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="Qatar">Qatar</option>
              <option value="Kuwait">Kuwait</option>
              <option value="Bahrain">Bahrain</option>
              <option value="Oman">Oman</option>
            </select>
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Sign in
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
