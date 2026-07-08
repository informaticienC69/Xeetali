import {
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  useEffect,
  useRef,
  useState,
  Children,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import type { LucideProps } from "lucide-react";
import { CheckCircle, Info, XCircle, ChevronDown, Check } from "lucide-react";
import { BLOOD_GROUPS as BG_LIST, type BloodGroup as BG } from "../../lib/api";

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
  DISPONIBLE: { bg: "var(--surface-2)",          color: "var(--txt-dim)",  border: "var(--line)",                label: "Disponible" },
  RESERVEE:   { bg: "rgba(217,119,6,0.08)",      color: "var(--warn)",    border: "rgba(217,119,6,0.3)",        label: "Réservée"   },
  UTILISEE:   { bg: "var(--surface-2)",          color: "var(--txt-mute)", border: "var(--line)",               label: "Utilisée"   },
  PERIMEE:    { bg: "rgba(230,57,70,0.10)",      color: "var(--blood)",   border: "rgba(230,57,70,0.35)",       label: "Périmée"    },
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
  NORMALE:   { bg: "rgba(90,96,120,0.10)",   color: "var(--txt-mute)", border: "var(--line)"                  },
  URGENTE:   { bg: "rgba(217,119,6,0.10)",   color: "var(--warn)",    border: "rgba(217,119,6,0.35)"          },
  CRITIQUE:  { bg: "rgba(230,57,70,0.10)",   color: "var(--blood)",   border: "rgba(230,57,70,0.35)"          },
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


