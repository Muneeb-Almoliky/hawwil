import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface BrandHeaderProps {
  showBack?: boolean;
  backHref?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function BrandHeader({
  showBack = false,
  backHref = "/",
  onBack,
  actions,
}: BrandHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-8 w-full">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm text-stone-500 hover:text-stone-950 hover:border-stone-300 transition-all shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href={backHref}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm text-stone-500 hover:text-stone-950 hover:border-stone-300 transition-all shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )
        )}

        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-100"
          aria-label="Hawwil home"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden="true">
              {/* H letterform */}
              <path d="M2 2v14M7 2v14M2 9h5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Diagonal send arrow */}
              <path d="M11.5 8L16 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M13 3h3v3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-stone-950 leading-tight">Hawwil</p>
            <p className="text-sm text-stone-500 leading-tight hidden sm:block">
              Transfer. Instantly. Honestly.
            </p>
          </div>
        </Link>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
