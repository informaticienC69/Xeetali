import { type CSSProperties, type ReactNode } from "react";

import { Spinner } from "./Spinner";
// ── Button ────────────────────────────────────────────────────────
// Défaut = "clinic" (bleu, action courante). "blood" est réservé aux actions
// à forte charge (urgence, don) — le rouge doit rester un signal rare.
type ButtonVariant = "clinic" | "blood" | "ghost" | "outline" | "secondary" | "danger";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  clinic: "btn-clinic",
  blood: "btn-blood",
  outline: "border font-mono text-[11px] uppercase tracking-wider hover:border-(--txt-mute) hover:text-(--txt) hover:bg-(--surface-2)",
  secondary: "border mono text-[11px] uppercase tracking-wider hover:border-(--line-2) hover:text-(--txt) hover:bg-(--surface)",
  danger: "border mono text-[11px] uppercase tracking-wider",
  ghost: "hover:text-(--txt) hover:bg-(--surface-2)",
};

const VARIANT_STYLE: Partial<Record<ButtonVariant, CSSProperties>> = {
  outline:   { borderColor: "var(--line-2)", color: "var(--txt-dim)", background: "var(--surface)" },
  secondary: { borderColor: "transparent", color: "var(--txt-dim)", background: "var(--surface-2)" },
  danger:    { borderColor: "color-mix(in srgb, var(--crit) 35%, transparent)", color: "var(--crit)", background: "var(--crit-tint)" },
  ghost:     { color: "var(--txt-dim)", background: "transparent" },
};

export function Button({
  children,
  variant = "clinic",
  loading,
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${VARIANT_CLASS[variant]} ${className}`}
      style={VARIANT_STYLE[variant]}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  );
}
