import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { XCircle } from "lucide-react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Piège de focus + focus initial + restauration à la fermeture — nécessaire
// pour toute boîte de dialogue modale (WCAG 2.2 · 2.4.3 Ordre du focus).
// Le focus initial va au premier élément focusable (pour ConfirmModal, c'est
// le bouton « Annuler », qui précède « Confirmer » dans le DOM — un Entrée
// accidentel juste après ouverture n'active donc jamais l'action destructrice).
function useDialogA11y(open: boolean, containerRef: RefObject<HTMLElement | null>, onEscape: () => void) {
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () => Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
    focusables()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    // Écoute sur le conteneur (capture) plutôt que window : n'intercepte que
    // les touches survenant réellement dans le dialogue.
    container?.addEventListener("keydown", onKeyDown, true);
    return () => {
      container?.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus();
    };
  }, [open, containerRef, onEscape]);
}

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
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, containerRef, onClose);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ background: "rgba(15,22,41,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-pop surface w-full max-w-md relative flex flex-col"
        style={{ padding: 24, maxHeight: "85vh", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            {subtitle && <div className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--txt-mute)" }}>{subtitle}</div>}
            <h2 id={titleId} className="font-semibold text-lg" style={{ color: "var(--txt)", letterSpacing: "-0.01em" }}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="tap-target rounded-lg text-lg transition-colors cursor-pointer"
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
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, containerRef, onCancel);

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
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-pop surface w-full max-w-sm relative overflow-hidden"
        style={{ padding: 26, borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)" }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
          style={{ background: c.tint }}
        >
          <XCircle size={22} style={{ color: c.accent }} />
        </div>
        <h2 id={titleId} className="font-semibold text-lg mb-2" style={{ color: "var(--txt)", letterSpacing: "-0.01em" }}>
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
            <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>Tab</kbd>
            {" "}naviguer ·{" "}
            <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>Échap</kbd>
            {" "}annuler
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
