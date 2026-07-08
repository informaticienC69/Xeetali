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

// ── Card ──────────────────────────────────────────────────────────
export function Card({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section 
      className={`card-in relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${className}`} 
      style={{ 
        padding: 24, 
        borderRadius: 24,
        background: "linear-gradient(145deg, var(--surface) 0%, var(--bg-2) 100%)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-lg)"
      }}
    >
      <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full pointer-events-none opacity-20" style={{ background: "radial-gradient(circle, var(--blood-glow) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="relative z-10">
        {(title || subtitle || action) && (
          <header className="flex items-start justify-between mb-6">
            <div>
              {subtitle && (
                <div className="mono uppercase text-[10px] tracking-[0.14em] mb-1" style={{ color: "var(--txt-mute)" }}>
                  {subtitle}
                </div>
              )}
              {title && (
                <h3 className="syne font-bold text-lg leading-tight tracking-wide" style={{ color: "var(--txt)" }}>
                  {title}
                </h3>
              )}
            </div>
            {action}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}


