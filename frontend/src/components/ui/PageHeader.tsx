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

// ── PageHeader ────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<LucideProps>;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 page-title-glow">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg relative overflow-hidden"
             style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.35)" }}>
          <div className="absolute inset-0 pulse-soft" style={{ background: "radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)" }} />
          <Icon size={18} style={{ color: "var(--blood)", position: "relative" }} />
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>{subtitle}</div>
          <h1 className="syne font-bold text-xl" style={{ color: "var(--txt)" }}>{title}</h1>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}


