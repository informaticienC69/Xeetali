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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg"
             style={{ background: "var(--clinic-tint)", border: "1px solid transparent" }}>
          <Icon size={18} style={{ color: "var(--clinic)" }} />
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--txt-mute)" }}>{subtitle}</div>
          <h1 className="font-bold text-xl" style={{ color: "var(--txt)", letterSpacing: "-0.015em" }}>{title}</h1>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}


