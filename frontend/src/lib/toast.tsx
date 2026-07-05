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

const STYLES: Record<ToastKind, { cls: string; Icon: typeof Info }> = {
  success: {
    cls: "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/80 dark:text-green-200",
    Icon: CheckCircle2,
  },
  error: {
    cls: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/80 dark:text-red-200",
    Icon: XCircle,
  },
  info: {
    cls: "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
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
      <div className="fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map(({ id, kind, message }) => {
          const { cls, Icon } = STYLES[kind];
          return (
            <div
              key={id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg animate-[fadeIn_0.15s_ease-out] ${cls}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1">{message}</span>
              <button onClick={() => dismiss(id)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Fermer">
                <X size={15} />
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
