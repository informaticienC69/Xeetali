import {
  type ComponentType,
} from "react";
import type { LucideProps } from "lucide-react";

import { useCountUp } from "./CountUp";
// ── KpiTile (premium avec barre accent) ─────────────────────────────────
const KPI_TONES = {
  normal: {
    bg:       "var(--surface)",
    border:   "var(--line)",
    bar:      "#94a3b8",
    accent:   "#64748b",
    numColor: "var(--txt)",
  },
  ok: {
    bg:       "var(--surface)",
    border:   "var(--line)",
    bar:      "#94a3b8",
    accent:   "#64748b",
    numColor: "var(--txt)",
  },
  warn: {
    bg:       "var(--surface)",
    border:   "rgba(217,119,6,0.3)",
    bar:      "#d97706",
    accent:   "#d97706",
    numColor: "var(--txt)",
  },
  crit: {
    bg:       "#fff1f2",
    border:   "rgba(230,57,70,0.35)",
    bar:      "#E63946",
    accent:   "#E63946",
    numColor: "#9f1239",
  },
} as const;

const KPI_TONES_DARK = {
  normal: {
    bg:       "var(--surface)",
    border:   "var(--line)",
    bar:      "#5b6685",
    accent:   "#93a0bf",
    numColor: "var(--txt)",
  },
  ok: {
    bg:       "var(--surface)",
    border:   "var(--line)",
    bar:      "#5b6685",
    accent:   "#93a0bf",
    numColor: "var(--txt)",
  },
  warn: {
    bg:       "rgba(245,158,11,0.07)",
    border:   "rgba(245,158,11,0.25)",
    bar:      "#f59e0b",
    accent:   "#f59e0b",
    numColor: "var(--txt)",
  },
  crit: {
    bg:       "rgba(230,57,70,0.07)",
    border:   "rgba(230,57,70,0.35)",
    bar:      "#E63946",
    accent:   "#E63946",
    numColor: "var(--txt)",
  },
} as const;
type KpiTone = keyof typeof KPI_TONES;

export function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "normal",
  pulse = false,
  delay = 0,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: number | string;
  sub?: string;
  tone?: KpiTone;
  pulse?: boolean;
  delay?: number;
}) {
  const animated = typeof value === "number" ? value : 0;
  const display = useCountUp(animated, 1200, delay);
  const shown = typeof value === "number" ? display.toLocaleString("fr-FR") : value;
  const lm = KPI_TONES[tone];
  const dm = KPI_TONES_DARK[tone];

  return (
    <div
      className={`card-in surface relative overflow-hidden chart-card-hover kpi-tile-${tone}-${delay} perspective-container tilt-card hover:-translate-y-2`}
      style={{
        padding: 18,
        paddingTop: 22,
        animationDelay: `${delay}ms`,
        background: lm.bg,
        borderColor: lm.border,
        boxShadow: "0 10px 30px rgba(0,0,0,0.02), inset 0 2px 0 rgba(255,255,255,0.4)"
      }}
    >
      {/* Dark mode override via injected style */}
      <style>{`
        .dark .kpi-tile-${tone}-${delay} {
          background: ${dm.bg} !important;
          border-color: ${dm.border} !important;
        }
        .dark .kpi-tile-${tone}-${delay} .kpi-num { color: ${dm.numColor} !important; }
        .dark .kpi-tile-${tone}-${delay} .kpi-accent { color: ${dm.accent} !important; }
      `}</style>

      {/* Barre d'accent top colorée */}
      <div
        className={`absolute top-0 left-0 right-0 pointer-events-none ${tone === "crit" || tone === "warn" ? (pulse ? "accent-pulse" : "") : ""}`}
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${lm.bar} 0%, ${lm.bar}88 60%, transparent 100%)`,
          borderRadius: "12px 12px 0 0",
        }}
      />

      <div className="relative flex items-start justify-between">
        <div className="mono uppercase text-[10px] tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
          {label}
        </div>
        <div
          className={`kpi-accent ${pulse ? "pulse-soft" : ""}`}
          style={{ color: lm.accent }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div className="relative mt-3 flex items-baseline gap-2">
        <div
          className="kpi-num syne font-extrabold text-[34px] leading-none"
          style={{ color: lm.numColor }}
        >
          {shown}
        </div>
        {sub && <div className="mono text-[11px]" style={{ color: "var(--txt-mute)" }}>{sub}</div>}
      </div>
    </div>
  );
}


