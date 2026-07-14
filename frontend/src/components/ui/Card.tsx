import { type ReactNode } from "react";

// ── Card ──────────────────────────────────────────────────────────
export function Card({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{
        padding: 22,
        borderRadius: "var(--radius)",
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="relative flex flex-col h-full">
        {(title || subtitle || action) && (
          <header className="flex items-start justify-between mb-5 shrink-0">
            <div>
              {subtitle && (
                <div className="mono uppercase text-[10px] tracking-[0.12em] mb-1" style={{ color: "var(--txt-mute)" }}>
                  {subtitle}
                </div>
              )}
              {title && (
                <h3 className="font-semibold text-lg leading-tight" style={{ color: "var(--txt)", letterSpacing: "-0.01em" }}>
                  {title}
                </h3>
              )}
            </div>
            {action}
          </header>
        )}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </section>
  );
}


