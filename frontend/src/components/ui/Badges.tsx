// ── GroupBadge ────────────────────────────────────────────────────
export function GroupBadge({ groupe }: { groupe: string }) {
  return (
    <span
      className="mono text-[11px] px-2 py-0.5 rounded-md border font-bold"
      style={{
        background: "var(--surface-2)",
        color: "var(--txt-dim)",
        borderColor: "var(--line)",
      }}
    >
      {groupe}
    </span>
  );
}


// ── StatusBadge ───────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  DISPONIBLE: { bg: "var(--ok-tint)",   color: "var(--ok)",       border: "transparent", label: "Disponible" },
  RESERVEE:   { bg: "var(--warn-tint)", color: "var(--warn)",     border: "transparent", label: "Réservée"   },
  UTILISEE:   { bg: "var(--surface-2)", color: "var(--txt-mute)", border: "var(--line)", label: "Utilisée"   },
  PERIMEE:    { bg: "var(--crit-tint)", color: "var(--crit)",     border: "transparent", label: "Périmée"    },
};

export function StatusBadge({ statut }: { statut: string }) {
  const s = STATUS_STYLES[statut] ?? { bg: "var(--surface-2)", color: "var(--txt-dim)", border: "var(--line)", label: statut };
  return (
    <span
      className="mono text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider font-medium"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {s.label}
    </span>
  );
}


// ── UrgencyBadge ─────────────────────────────────────────────────
const URGENCY_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  NORMALE:   { bg: "var(--surface-2)", color: "var(--txt-mute)", border: "var(--line)"  },
  URGENTE:   { bg: "var(--warn-tint)", color: "var(--warn)",     border: "transparent"  },
  CRITIQUE:  { bg: "var(--crit-tint)", color: "var(--crit)",     border: "transparent"  },
};

export function UrgencyBadge({ urgence }: { urgence: string }) {
  const u = URGENCY_STYLES[urgence] ?? URGENCY_STYLES.NORMALE;
  return (
    <span
      className="mono text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider font-medium"
      style={{ background: u.bg, color: u.color, borderColor: u.border }}
    >
      {urgence}
    </span>
  );
}


