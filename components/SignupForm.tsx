"use client";

import { SignupFields } from "@/components/SignupFields";
import { SubmitButton } from "@/components/SubmitButton";
import { signUpAction } from "@/app/signup/actions";

export function SignupForm() {
  return (
    <form action={signUpAction} className="flex flex-col gap-4">
      <SignupFields />
      <p className="text-xs text-stone-500">
        After signing up, click the link in your email — you&apos;ll be signed in automatically.
      </p>
      <SubmitButton
        pendingLabel="Creating account…"
        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:text-stone-500 text-white font-bold py-3.5 transition-colors"
      >
        Create account
      </SubmitButton>
    </form>
  );
}
