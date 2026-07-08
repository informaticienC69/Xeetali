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

// ── EmptyState ────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="mono text-[12px]" style={{ color: "var(--txt-mute)" }}>{message}</p>
    </div>
  );
}


