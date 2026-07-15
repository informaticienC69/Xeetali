import { type ReactNode } from "react";

// ── Toolbar ───────────────────────────────────────────────────────
export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {children}
    </div>
  );
}
