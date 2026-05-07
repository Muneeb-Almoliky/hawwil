import { AppShell } from "@/components/AppShell";
import { BrandHeader } from "@/components/BrandHeader";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={["rounded-2xl bg-stone-200/80 animate-pulse", className].join(" ")}
      aria-hidden
    />
  );
}

export function PageLoadingSkeleton() {
  return (
    <AppShell showPanel={false}>
      <BrandHeader />
      <div className="flex flex-col gap-6 flex-1">
        <SkeletonBlock className="h-10 w-2/3 max-w-md" />
        <SkeletonBlock className="h-36 w-full max-w-lg" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-14 w-full" />
      </div>
    </AppShell>
  );
}
