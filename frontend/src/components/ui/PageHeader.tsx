import { type ComponentType, type ReactNode } from "react";
import type { LucideProps } from "lucide-react";

// ── PageHeader ────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<LucideProps>;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg"
             style={{ background: "var(--clinic-tint)", border: "1px solid transparent" }}>
          <Icon size={18} style={{ color: "var(--clinic)" }} />
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--txt-mute)" }}>{subtitle}</div>
          <h1 className="font-bold text-xl" style={{ color: "var(--txt)", letterSpacing: "-0.015em" }}>{title}</h1>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}


