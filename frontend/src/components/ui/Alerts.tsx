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

// ── AlertBanner (ticker) ──────────────────────────────────────────
export function AlertBanner({ items }: { items: { icon?: ComponentType<LucideProps>; label: string }[] }) {
  const doubled = [...items, ...items];
  return (
    <div
      className="overflow-hidden py-1.5"
      style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}
    >
      <div className="ticker-track mono text-[11px]" style={{ color: "var(--txt-mute)" }}>
        {doubled.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            {it.icon && <it.icon size={11} style={{ color: "var(--blood)" }} />}
            <span>{it.label}</span>
            <span className="mx-2" style={{ color: "var(--txt-mute)" }}>●</span>
          </span>
        ))}
      </div>
    </div>
  );
}


// ── Toast ─────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "info";

interface ToastEntry {
  id: number;
  type: ToastType;
  message: string;
}

let _toastId = 0;
let _emit: ((t: ToastEntry) => void) | null = null;

export const toast = {
  success: (msg: string) => _emit?.({ id: ++_toastId, type: "success", message: msg }),
  error:   (msg: string) => _emit?.({ id: ++_toastId, type: "error",   message: msg }),
  info:    (msg: string) => _emit?.({ id: ++_toastId, type: "info",    message: msg }),
};

function ToastItem({ entry, onDone }: { entry: ToastEntry; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  const icons = { success: CheckCircle, error: XCircle, info: Info };
  const colors = {
    success: { bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.35)", color: "var(--ok)" },
    error:   { bg: "rgba(230,57,70,0.10)", border: "rgba(230,57,70,0.40)", color: "var(--blood)" },
    info:    { bg: "rgba(29,53,87,0.10)",  border: "var(--line)",          color: "var(--txt-dim)" },
  };
  const Icon = icons[entry.type];
  const c = colors[entry.type];
  return (
    <div
      className="card-in pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 surface"
      style={{ minWidth: 280, maxWidth: 380, background: c.bg, borderColor: c.border, boxShadow: "var(--shadow-lg)" }}
    >
      <Icon size={16} style={{ color: c.color, flexShrink: 0, marginTop: 1 }} />
      <p className="mono text-[12px] flex-1" style={{ color: "var(--txt)" }}>{entry.message}</p>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  useEffect(() => {
    _emit = (t) => setToasts((prev) => [...prev, t]);
    return () => { _emit = null; };
  }, []);
  const remove = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));
  return (
    <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => <ToastItem key={t.id} entry={t} onDone={() => remove(t.id)} />)}
    </div>
  );
}


