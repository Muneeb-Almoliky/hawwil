import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";
import { VerifyEmailActions } from "@/components/VerifyEmailActions";
import { LogoutButton } from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isEmailVerified } from "@/lib/auth/email-verification";

interface VerifyEmailPageProps {
  searchParams: Promise<{ next?: string }>;
}

function sanitizeNextPath(nextPath: string | undefined): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/home";
  }
  return nextPath;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);

  if (!isSupabaseConfigured()) {
    redirect("/home");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (isEmailVerified(user)) {
    redirect(nextPath);
  }

  const email = user.email ?? "";

  return (
    <AppShell showPanel={false}>
      <BrandHeader actions={<LogoutButton />} />

      <div className="flex flex-col flex-1 gap-6">
        <div>
          <h1 className="text-3xl font-black text-stone-950 tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Open the link we sent to finish activating your account. You can sign in only after
            verification.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col gap-4 text-sm text-emerald-800">
          <p>
            We sent a message to{" "}
            <span className="font-semibold text-emerald-900">{email || "your email"}</span>.
            If it arrived on WhatsApp or another app, that is normal for your email provider —
            use the link in that message.
          </p>
          <VerifyEmailActions email={email} />
        </div>

        <p className="text-sm text-stone-600">
          Wrong account? Use <span className="font-semibold text-stone-700">Sign out</span> above,
          then sign in with a different email.
        </p>

        <Link
          href="/login"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 text-center"
        >
          Back to sign in
        </Link>
      </div>
    </AppShell>
  );
}
