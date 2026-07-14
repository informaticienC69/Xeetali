import {
  type ReactNode,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { XCircle } from "lucide-react";

// ── Modal ─────────────────────────────────────────────────────────
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
      style={{ background: "rgba(15,22,41,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-pop surface w-full max-w-md relative flex flex-col"
        style={{ padding: 24, maxHeight: "85vh", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            {subtitle && <div className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--txt-mute)" }}>{subtitle}</div>}
            <h2 className="font-semibold text-lg" style={{ color: "var(--txt)", letterSpacing: "-0.01em" }}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors cursor-pointer"
            style={{ color: "var(--txt-mute)", background: "var(--surface-2)" }}
            aria-label="Fermer"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--txt)"; }}
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

  // Le rouge n'est conservé ici que pour une confirmation à conséquence forte.
  const tones = {
    blood: { accent: "var(--crit)", tint: "var(--crit-tint)", btn: "var(--blood)", btnHover: "var(--blood-dim)" },
    warn:  { accent: "var(--warn)", tint: "var(--warn-tint)", btn: "var(--warn)", btnHover: "var(--warn)" },
    ok:    { accent: "var(--ok)",   tint: "var(--ok-tint)",   btn: "var(--ok)",   btnHover: "var(--ok)" },
  };
  const c = tones[tone];

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ background: "rgba(15,22,41,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="modal-pop surface w-full max-w-sm relative overflow-hidden"
        style={{ padding: 26, borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)" }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
          style={{ background: c.tint }}
        >
          <XCircle size={22} style={{ color: c.accent }} />
        </div>
        <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--txt)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {description && (
          <p className="text-[13px] mb-2" style={{ color: "var(--txt-dim)" }}>
            {description}
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--txt-dim)" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors cursor-pointer"
            style={{ background: c.btn }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = c.btnHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = c.btn; }}
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
