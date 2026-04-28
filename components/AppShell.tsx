import { SummaryPanel } from "./SummaryPanel";

interface AppShellProps {
  children: React.ReactNode;
  showPanel?: boolean;
  rightContent?: React.ReactNode;
  expandMain?: boolean;
}

export function AppShell({
  children,
  showPanel = false,
  rightContent,
  expandMain = false,
}: AppShellProps) {
  const hasRight = showPanel || !!rightContent;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <div className={[
        "flex-1 grid grid-cols-1",
        hasRight ? "md:grid-cols-[1fr_380px]" : "",
      ].join(" ")}>
        {/* Left — main content */}
        <main className={[
          "flex flex-col flex-1 px-6 py-8 md:py-12 w-full",
          hasRight
            ? expandMain
              ? "md:px-14 max-w-lg md:max-w-none md:mx-0 mx-auto"
              : "md:px-14 max-w-lg md:max-w-xl md:mx-0 mx-auto"
            : "max-w-xl mx-auto md:px-8",
        ].join(" ")}>
          {children}
        </main>

        {/* Right — Transfer summary or custom content */}
        {showPanel && (
          <aside className="hidden md:flex flex-col bg-white border-l border-stone-200 px-8 py-10 overflow-y-auto">
            <SummaryPanel />
          </aside>
        )}
        {!showPanel && rightContent && (
          <aside className="hidden md:flex flex-col bg-white border-l border-stone-200 px-8 py-10 overflow-y-auto">
            {rightContent}
          </aside>
        )}
      </div>

      {/* Mobile summary — only when transfer panel enabled */}
      {showPanel && (
        <div className="md:hidden border-t border-stone-200 bg-white px-6 py-6">
          <SummaryPanel />
        </div>
      )}
    </div>
  );
}
