"use client";

import { useState, useTransition } from "react";
import { Mail, Lock } from "lucide-react";

interface LoginFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultNext: string;
  initialMode?: "magic" | "password";
}

function Spinner() {
  return (
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
  );
}

export function LoginForm({ action, defaultNext, initialMode = "password" }: LoginFormProps) {
  const [mode, setMode] = useState<"magic" | "password">(initialMode);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  }

  const pendingLabel = mode === "magic" ? "Sending link…" : "Signing in…";
  const submitLabel = mode === "magic" ? "Send magic link" : "Sign in with password";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={defaultNext} />

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => setMode("magic")}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all disabled:opacity-50",
            mode === "magic"
              ? "bg-white shadow-sm text-stone-950"
              : "text-stone-500 hover:text-stone-700",
          ].join(" ")}
        >
          <Mail className="w-3.5 h-3.5" />
          Magic link
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setMode("password")}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all disabled:opacity-50",
            mode === "password"
              ? "bg-white shadow-sm text-stone-950"
              : "text-stone-500 hover:text-stone-700",
          ].join(" ")}
        >
          <Lock className="w-3.5 h-3.5" />
          Password
        </button>
      </div>

      <input type="hidden" name="mode" value={mode} />

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          disabled={isPending}
          autoComplete="email"
          placeholder="you@example.com"
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />
      </label>

      {mode === "password" && (
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Password
          </span>
          <input
            name="password"
            type="password"
            required
            disabled={isPending}
            autoComplete="current-password"
            placeholder="Your password"
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </label>
      )}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold py-3.5 transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Spinner />
            {pendingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>

      {mode === "magic" && (
        <p className="text-xs text-stone-400 text-center -mt-2">
          We&apos;ll email you a one-click sign-in link. No password needed.
        </p>
      )}
    </form>
  );
}
