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

// ── Skeleton (shimmer premium) ───────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={"rounded-xl shimmer " + className}
    />
  );
}


