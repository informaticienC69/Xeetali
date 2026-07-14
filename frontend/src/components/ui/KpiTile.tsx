import {
  type ComponentType,
} from "react";
import type { LucideProps } from "lucide-react";



// ── KpiTile ─────────────────────────────────────────────────────────
// Sobre : surface neutre, liseré d'accent seulement pour warn/crit, chiffre
// en mono tabulaire. Le dark est géré par les tokens (aucun override manuel).
const KPI_TONES = {
  normal: { bar: "transparent", accent: "var(--txt-mute)", numColor: "var(--txt)" },
  ok:     { bar: "var(--ok)",   accent: "var(--ok)",       numColor: "var(--txt)" },
  warn:   { bar: "var(--warn)", accent: "var(--warn)",     numColor: "var(--txt)" },
  crit:   { bar: "var(--crit)", accent: "var(--crit)",     numColor: "var(--crit)" },
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
      {/* Liseré d'accent (seulement warn/crit — sinon neutre) */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ height: 3, background: t.bar, borderRadius: "12px 12px 0 0" }}
      />

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
