import { type ReactNode } from "react";
import { Check } from "lucide-react";
import { BLOOD_GROUPS as BG_LIST, type BloodGroup as BG } from "../../lib/api";

import { Select } from "./Forms";
// ── BloodGroupSelector ────────────────────────────────────────────
// Grille 4×2. La sélection est une simple mise en avant (bleu clinique),
// pas une urgence — donc pas de rouge.
export function BloodGroupSelector({
  value,
  onChange,
}: {
  value: BG;
  onChange: (g: BG) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BG_LIST.map((g) => {
        const isSelected = g === value;
        const isNeg = g.includes("-");
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className="relative flex flex-col items-center justify-center rounded-xl transition-colors duration-150 cursor-pointer"
            style={{
              padding: "10px 6px",
              background: isSelected ? "var(--clinic-tint)" : "var(--surface-2)",
              border: `2px solid ${isSelected ? "var(--clinic)" : "var(--line)"}`,
            }}
            onMouseEnter={(e) => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--line-2)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
            }}
          >
            <span
              className="mono text-[8px] font-bold mb-0.5 uppercase tracking-wider"
              style={{ color: isNeg ? "var(--warn)" : "var(--ok)" }}
            >
              {isNeg ? "RH−" : "RH+"}
            </span>
            <span
              className="num font-bold text-base leading-none"
              style={{ color: isSelected ? "var(--clinic-dim)" : "var(--txt)" }}
            >
              {g.replace(/[+-]/, "")}
            </span>
            {isSelected && (
              <span
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: "var(--clinic)" }}
              >
                <Check size={9} className="text-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}


// ── UrgencySelector ────────────────────────────────────────────────
// Ici le rouge est légitime : CRITIQUE = urgence réelle. Sobre (teinte + bord).
const URGENCY_CONFIG = [
  { value: "NORMALE",  label: "Normale",  sub: "Délai standard", color: "var(--txt-mute)", bgActive: "var(--surface-2)", borderActive: "var(--line-2)" },
  { value: "URGENTE",  label: "Urgente",  sub: "Sous 24h",       color: "var(--warn)",     bgActive: "var(--warn-tint)", borderActive: "var(--warn)"   },
  { value: "CRITIQUE", label: "Critique", sub: "Immédiat",       color: "var(--crit)",     bgActive: "var(--crit-tint)", borderActive: "var(--crit)"   },
] as const;

export function UrgencySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {URGENCY_CONFIG.map((u) => {
        const isSelected = u.value === value;
        return (
          <button
            key={u.value}
            type="button"
            onClick={() => onChange(u.value)}
            className="flex flex-col items-center justify-center rounded-xl transition-colors duration-150 cursor-pointer relative overflow-hidden"
            style={{
              padding: "12px 8px",
              background: isSelected ? u.bgActive : "var(--surface-2)",
              border: `2px solid ${isSelected ? u.borderActive : "var(--line)"}`,
            }}
          >
            <span className="font-semibold text-sm" style={{ color: isSelected ? u.color : "var(--txt-dim)" }}>
              {u.label}
            </span>
            <span
              className="mono text-[9px] mt-0.5 uppercase tracking-wider"
              style={{ color: isSelected ? u.color : "var(--txt-mute)" }}
            >
              {u.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}


// ── FilterSelect ──────────────────────────────────────────────────
export function FilterSelect({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      style={{ minWidth: 160 }}
    >
      {children}
    </Select>
  );
}
