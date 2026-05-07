"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface VerifyEmailActionsProps {
  email: string;
}

export function VerifyEmailActions({ email }: VerifyEmailActionsProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={isSending || !email}
        onClick={async () => {
          setIsSending(true);
          setStatusMessage(null);
          try {
            const supabase = createClient();
            const { error } = await supabase.auth.resend({
              type: "signup",
              email,
            });
            if (error) {
              setStatusMessage(error.message);
              return;
            }
            setStatusMessage("Verification email sent again. Check your inbox.");
          } catch {
            setStatusMessage("Could not resend email. Try again shortly.");
          } finally {
            setIsSending(false);
          }
        }}
        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-3.5 transition-colors"
      >
        {isSending ? "Sending…" : "Resend verification email"}
      </button>
      {statusMessage && (
        <p className="text-xs text-stone-600 text-center">{statusMessage}</p>
      )}
    </div>
  );
}
