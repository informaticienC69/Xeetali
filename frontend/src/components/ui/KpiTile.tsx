import {
  type ComponentType,
} from "react";
import type { LucideProps } from "lucide-react";



// ── KpiTile ─────────────────────────────────────────────────────────
// Sobre : surface neutre, chiffre en mono tabulaire.
// Le dark est géré par les tokens (aucun override manuel).
const KPI_TONES = {
  normal: { accent: "var(--txt-mute)", numColor: "var(--txt)" },
  ok:     { accent: "var(--ok)",       numColor: "var(--txt)" },
  warn:   { accent: "var(--warn)",     numColor: "var(--txt)" },
  crit:   { accent: "var(--crit)",     numColor: "var(--crit)" },
} as const;
type KpiTone = keyof typeof KPI_TONES;

export function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "normal",
  pulse = false,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: number | string;
  sub?: string;
  tone?: KpiTone;
  pulse?: boolean;
}) {
  void pulse; // conservé pour compat d'API ; plus de pulsation (contexte médical)
  const animated = typeof value === "number" ? value : 0;
  const shown = typeof value === "number" ? animated.toLocaleString("fr-FR") : value;
  const t = KPI_TONES[tone];

  return (
    <div
      className="surface relative overflow-hidden"
      style={{
        padding: 18,
        paddingTop: 20,
      }}
    >
      <div className="relative flex items-start justify-between">
        <div className="mono uppercase text-[10px] tracking-[0.12em]" style={{ color: "var(--txt-mute)" }}>
          {label}
        </div>
        <div style={{ color: t.accent }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="relative mt-3 flex items-baseline gap-2">
        <div
          className="kpi-num num font-semibold text-[32px] leading-none"
          style={{ color: t.numColor, letterSpacing: "-0.02em" }}
        >
          {shown}
        </div>
        {sub && <div className="mono text-[11px]" style={{ color: "var(--txt-mute)" }}>{sub}</div>}
      </div>
    </div>
  );
}
