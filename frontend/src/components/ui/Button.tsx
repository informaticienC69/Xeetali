import { type ReactNode } from "react";

import { Spinner } from "./Spinner";
// ── Button ────────────────────────────────────────────────────────
type ButtonVariant = "blood" | "ghost" | "outline" | "secondary" | "danger";

export function Button({
  children,
  variant = "blood",
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
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer";

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
        className={`${base} border font-mono text-[11px] uppercase tracking-wider hover:border-(--txt-mute) hover:text-(--txt) ${className}`}
        style={{
          borderColor: "var(--line)",
          color: "var(--txt-dim)",
          background: "transparent",
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
        className={`${base} border mono text-[11px] uppercase tracking-wider hover:border-(--txt-mute) hover:text-(--txt) ${className}`}
        style={{ borderColor: "var(--line)", color: "var(--txt-dim)", background: "var(--surface-2)" }}
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
        className={`${base} border mono text-[11px] uppercase tracking-wider hover:bg-[rgba(230,57,70,0.15)] ${className}`}
        style={{ borderColor: "rgba(230,57,70,0.35)", color: "var(--blood)", background: "rgba(230,57,70,0.08)" }}
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


