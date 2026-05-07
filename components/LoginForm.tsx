"use client";

import { useState } from "react";
import { Mail, Lock } from "lucide-react";

interface LoginFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultNext: string;
  initialMode?: "magic" | "password";
}

export function LoginForm({ action, defaultNext, initialMode = "password" }: LoginFormProps) {
  const [mode, setMode] = useState<"magic" | "password">(initialMode);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={defaultNext} />

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 gap-1">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all",
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
          onClick={() => setMode("password")}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all",
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
          autoComplete="email"
          placeholder="you@example.com"
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
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
            autoComplete="current-password"
            placeholder="Your password"
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />
        </label>
      )}

      <button
        type="submit"
        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 transition-colors"
      >
        {mode === "magic" ? "Send magic link" : "Sign in with password"}
      </button>

      {mode === "magic" && (
        <p className="text-xs text-stone-400 text-center -mt-2">
          We&apos;ll email you a one-click sign-in link. No password needed.
        </p>
      )}
    </form>
  );
}
