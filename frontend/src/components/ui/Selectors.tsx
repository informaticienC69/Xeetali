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

import { Select } from "./Forms";
// ── BloodGroupSelector ────────────────────────────────────────────
// Sélecteur visuel premium de groupe sanguin (grille 4×2)

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
            className="relative flex flex-col items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
            style={{
              padding: "10px 6px",
              background: isSelected
                ? "linear-gradient(135deg, rgba(230,57,70,0.25) 0%, rgba(230,57,70,0.10) 100%)"
                : "var(--surface-2)",
              border: `2px solid ${isSelected ? "var(--blood)" : "var(--line)"}`,
              boxShadow: isSelected
                ? "0 0 0 1px rgba(230,57,70,0.2), 0 4px 12px rgba(230,57,70,0.25)"
                : "none",
              transform: isSelected ? "scale(1.04)" : "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(230,57,70,0.45)";
                (e.currentTarget as HTMLElement).style.background = "rgba(230,57,70,0.07)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              }
            }}
          >
            <span
              className="mono text-[8px] font-bold mb-0.5 uppercase tracking-wider"
              style={{ color: isNeg ? "var(--warn)" : "var(--ok)", opacity: 0.8 }}
            >
              {isNeg ? "RH\u2212" : "RH+"}
            </span>
            <span
              className="syne font-extrabold text-base leading-none"
              style={{ color: isSelected ? "var(--blood)" : "var(--txt)" }}
            >
              {g.replace(/[+-]/, "")}
            </span>
            {isSelected && (
              <span
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full scale-bounce"
                style={{ background: "var(--blood)" }}
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
const URGENCY_CONFIG = [
  { value: "NORMALE",  label: "Normale",  sub: "Délai standard", color: "var(--txt-mute)", bgActive: "rgba(90,96,120,0.20)",  borderActive: "rgba(90,96,120,0.55)"  },
  { value: "URGENTE",  label: "Urgente",  sub: "Sous 24h",        color: "var(--warn)",     bgActive: "rgba(217,119,6,0.15)",  borderActive: "rgba(217,119,6,0.55)"  },
  { value: "CRITIQUE", label: "Critique", sub: "Immédiat",        color: "var(--blood)",    bgActive: "rgba(230,57,70,0.15)",  borderActive: "rgba(230,57,70,0.55)"  },
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
            className="flex flex-col items-center justify-center rounded-xl transition-all duration-150 cursor-pointer relative overflow-hidden"
            style={{
              padding: "12px 8px",
              background: isSelected ? u.bgActive : "var(--surface-2)",
              border: `2px solid ${isSelected ? u.borderActive : "var(--line)"}`,
              transform: isSelected ? "scale(1.03)" : "scale(1)",
              boxShadow: isSelected ? `0 4px 16px ${u.color}30` : "none",
            }}
          >
            {u.value === "CRITIQUE" && isSelected && (
              <span
                className="absolute inset-0 pointer-events-none pulse-soft"
                style={{ background: `radial-gradient(circle at center, rgba(230,57,70,0.15) 0%, transparent 70%)` }}
              />
            )}
            <span className="syne font-bold text-sm" style={{ color: isSelected ? u.color : "var(--txt-dim)" }}>
              {u.label}
            </span>
            <span
              className="mono text-[9px] mt-0.5 uppercase tracking-wider"
              style={{ color: isSelected ? u.color : "var(--txt-mute)", opacity: 0.8 }}
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


