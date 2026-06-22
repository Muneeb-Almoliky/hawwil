"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertCircle } from "lucide-react";

interface VerifyEmailActionsProps {
  email: string;
}

function mapResendError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("for security purposes")) {
    return "You\u2019ve requested too many emails. Wait a minute, then try again.";
  }
  if (m.includes("user not found") || m.includes("no user")) {
    return "We couldn\u2019t find an account for this email address.";
  }
  return "Couldn\u2019t resend the email. Please try again in a moment.";
}

export function VerifyEmailActions({ email }: VerifyEmailActionsProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleResend() {
    setStatus("sending");
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        setErrorMessage(mapResendError(error.message));
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setErrorMessage("Couldn\u2019t resend the email. Check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={status === "sending" || status === "sent" || !email}
        onClick={handleResend}
        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold py-3.5 transition-colors flex items-center justify-center gap-2"
      >
        {status === "sending" ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending…
          </>
        ) : status === "sent" ? (
          "Email sent \u2014 check your inbox"
        ) : (
          "Resend verification email"
        )}
      </button>

      {status === "sent" && (
        <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
          <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Verification email sent to <span className="font-semibold">{email}</span>. Check your inbox (and spam folder).</span>
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-white border border-rose-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
