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
        className={`${base} border font-mono text-[11px] uppercase tracking-wider ${className}`}
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
        className={`${base} border mono text-[11px] uppercase tracking-wider ${className}`}
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
        className={`${base} border mono text-[11px] uppercase tracking-wider ${className}`}
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
      className={`${base} ${className}`}
      style={{ color: "var(--txt-dim)", background: "transparent" }}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  );
}


