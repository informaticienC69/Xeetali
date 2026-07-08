import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string) => void;
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastKind, { border: string; glow: string; icon: string; Icon: typeof Info }> = {
  success: {
    border: "rgba(16, 185, 129, 0.3)",
    glow: "rgba(16, 185, 129, 0.15)",
    icon: "#10B981", // Emerald
    Icon: CheckCircle2,
  },
  error: {
    border: "rgba(230, 57, 70, 0.3)",
    glow: "rgba(230, 57, 70, 0.15)",
    icon: "var(--blood)",
    Icon: XCircle,
  },
  info: {
    border: "var(--line)",
    glow: "rgba(0, 0, 0, 0.05)",
    icon: "var(--txt-dim)",
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    push,
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-6 z-9999 flex flex-col items-center gap-3 px-4 pointer-events-none">
        {toasts.map(({ id, kind, message }) => {
          const s = STYLES[kind];
          return (
            <div
              key={id}
              role="status"
              className="pointer-events-auto flex items-center gap-3 rounded-full border px-5 py-3 text-[14px] shadow-2xl animate-in fade-in slide-in-from-top-6 duration-500 mx-auto w-max max-w-[90vw]"
              style={{
                background: "color-mix(in srgb, var(--surface) 85%, transparent)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderColor: s.border,
                color: "var(--txt)",
                boxShadow: `0 8px 30px ${s.glow}, 0 1px 3px rgba(0,0,0,0.05)`,
              }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0" style={{ background: `color-mix(in srgb, ${s.icon} 10%, transparent)` }}>
                <s.Icon size={14} style={{ color: s.icon }} />
              </div>
              <span className="syne font-semibold tracking-wide">{message}</span>
              <button 
                onClick={() => dismiss(id)} 
                className="shrink-0 ml-1 flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10" 
                aria-label="Fermer" 
                style={{ color: "var(--txt-mute)" }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un ToastProvider");
  return ctx;
}
