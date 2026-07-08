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

// ── Modal Command Center ──────────────────────────────────────────
export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-pop surface w-full max-w-md relative flex flex-col"
        style={{ padding: 24, maxHeight: "85vh", borderRadius: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ height: 3, background: "linear-gradient(90deg, var(--blood) 0%, rgba(230,57,70,0.2) 100%)" }}
        />
        <div className="flex items-center justify-between mb-5 shrink-0 relative">
          <div>
            {subtitle && <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>{subtitle}</div>}
            <h2 className="syne font-bold text-lg" style={{ color: "var(--txt)" }}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg mono text-lg font-bold transition-colors"
            style={{ color: "var(--txt-mute)", background: "var(--surface-2)" }}
            aria-label="Fermer"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--blood)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--txt-mute)"; }}
          >
            ×
          </button>
        </div>
        <div className="relative overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
}


// ── ConfirmModal ───────────────────────────────────────────────────
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "blood",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "blood" | "warn" | "ok";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const colors = {
    blood: { accent: "#E63946", bg: "rgba(230,57,70,0.12)", border: "rgba(230,57,70,0.35)", glow: "var(--blood-glow)" },
    warn:  { accent: "#d97706", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.35)", glow: "rgba(217,119,6,0.25)"  },
    ok:    { accent: "#16a34a", bg: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.35)", glow: "rgba(22,163,74,0.25)"  },
  };
  const c = colors[tone];

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="modal-pop surface w-full max-w-sm relative overflow-hidden"
        style={{
          padding: 28,
          borderRadius: 20,
          border: `1px solid ${c.border}`,
          boxShadow: `0 0 0 1px ${c.border}, 0 32px 64px rgba(0,0,0,0.4), 0 0 60px ${c.glow}`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: 3, background: `linear-gradient(90deg, ${c.accent} 0%, ${c.accent}44 80%, transparent 100%)` }}
        />
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}
        >
          <XCircle size={22} style={{ color: c.accent }} />
        </div>
        <h2 className="syne font-bold text-lg mb-2" style={{ color: "var(--txt)" }}>
          {title}
        </h2>
        {description && (
          <p className="mono text-[12px] mb-2" style={{ color: "var(--txt-mute)" }}>
            {description}
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl syne font-bold text-sm transition-all cursor-pointer"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--txt-dim)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line-2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl syne font-bold text-sm text-white transition-all cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accent}cc 100%)`,
              border: `1px solid ${c.border}`,
              boxShadow: `0 4px 16px ${c.glow}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            {confirmLabel}
          </button>
        </div>
        <div className="mt-4 text-center">
          <span className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
            <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>Entrée</kbd>
            {" "}confirmer ·{" "}
            <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>Échap</kbd>
            {" "}annuler
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
