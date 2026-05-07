import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { SignupForm } from "@/components/SignupForm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isEmailVerified } from "@/lib/auth/email-verification";

interface SignupPageProps {
  searchParams: Promise<{ error?: string; sent?: string; email?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const isConfirmationSent = params.sent === "1";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (!isEmailVerified(user)) {
        redirect("/verify-email?next=/home");
      }
      redirect("/home");
    }
  }

  return (
    <AppShell showPanel={false}>
      <BrandHeader />

      <div className="flex flex-col flex-1 gap-6">
        <div>
          <h1 className="text-3xl font-black text-stone-950 tracking-tight">
            {isConfirmationSent ? "Check your email" : "Create account"}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {isConfirmationSent
              ? "One more step: open the link we sent to finish setup."
              : "Start sending with your Hawwil account."}
          </p>
        </div>

        {isConfirmationSent ? (
          <>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col gap-4 text-sm text-emerald-700">
              <p>
                Account created. We sent a verification link to{" "}
                <span className="font-semibold text-emerald-800">
                  {params.email ?? "your email"}
                </span>
                . After you verify, sign in with the password you chose.
              </p>
              <Link
                href="/login?mode=password"
                className="inline-flex items-center justify-center w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 transition-colors text-center"
              >
                Continue to sign in
              </Link>
            </div>
            <p className="text-sm text-stone-600">
              Need a different email?{" "}
              <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
                Start over
              </Link>
            </p>
          </>
        ) : (
          <>
            {params.error && (
              <div className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-700">
                {params.error}
              </div>
            )}

            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5">
              <SignupForm />
            </div>

            <p className="text-sm text-stone-600">
              Already have an account?{" "}
              <Link href="/login?mode=password" className="font-semibold text-emerald-700 hover:text-emerald-800">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
