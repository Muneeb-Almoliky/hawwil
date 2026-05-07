"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "rounded-2xl border border-stone-200 bg-white text-stone-950 shadow-md",
            title: "text-stone-950 font-semibold",
            description: "text-stone-600 text-sm",
            closeButton: "text-stone-500",
          },
        }}
      />
    </>
  );
}
