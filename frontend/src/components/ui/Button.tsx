import { type ReactNode } from "react";

import { Spinner } from "./Spinner";
// ── Button ────────────────────────────────────────────────────────
// Défaut = "clinic" (bleu, action courante). "blood" est réservé aux actions
// à forte charge (urgence, don) — le rouge doit rester un signal rare.
type ButtonVariant = "clinic" | "blood" | "ghost" | "outline" | "secondary" | "danger";

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

  if (variant === "clinic") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`btn-clinic ${base} ${className}`}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  if (variant === "blood") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`btn-blood ${base} ${className}`}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  if (variant === "outline") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} border font-mono text-[11px] uppercase tracking-wider hover:border-(--txt-mute) hover:text-(--txt) hover:bg-(--surface-2) ${className}`}
        style={{
          borderColor: "var(--line-2)",
          color: "var(--txt-dim)",
          background: "var(--surface)",
        }}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  if (variant === "secondary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} border mono text-[11px] uppercase tracking-wider hover:border-(--line-2) hover:text-(--txt) hover:bg-(--surface) ${className}`}
        style={{ borderColor: "transparent", color: "var(--txt-dim)", background: "var(--surface-2)" }}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  if (variant === "danger") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} border mono text-[11px] uppercase tracking-wider ${className}`}
        style={{ borderColor: "color-mix(in srgb, var(--crit) 35%, transparent)", color: "var(--crit)", background: "var(--crit-tint)" }}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} hover:text-(--txt) hover:bg-(--surface-2) ${className}`}
      style={{ color: "var(--txt-dim)", background: "transparent" }}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  );
}
