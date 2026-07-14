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

// ── Field ─────────────────────────────────────────────────────────
export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}


// ── Input ─────────────────────────────────────────────────────────
export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`cc-input ${className}`}
    />
  );
}


// ── SearchInput ───────────────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}


// ── Select ────────────────────────────────────────────────────────
function parseOptions(children: ReactNode) {
  return Children.toArray(children)
    .filter((child): child is ReactElement => typeof child === "object" && "props" in child && (child as any).type === "option")
    .map((child: any) => ({
      value: child.props.value,
      label: child.props.children,
      disabled: child.props.disabled,
    }));
}

export function Select({
  className = "",
  children,
  value,
  onChange,
  style,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = parseOptions(children);
  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef} style={style}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cc-input w-full flex items-center justify-between gap-3 text-left transition-all"
        style={{
          background: "var(--surface)",
          color: "var(--txt)",
          height: "100%",
          borderColor: open ? "var(--clinic)" : undefined,
          boxShadow: open ? "0 0 0 3px var(--clinic-tint)" : undefined,
        }}
      >
        <span className="truncate font-medium">{selectedOption?.label || "Sélectionner..."}</span>
        <ChevronDown
          size={14}
          className={`chevron-rotate shrink-0 transition-all ${open ? "open" : ""}`}
          style={{ color: open ? "var(--clinic)" : "var(--txt-mute)" }}
        />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-120 flex items-center justify-center p-6"
          style={{ background: "rgba(15,22,41,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="modal-pop w-full overflow-hidden flex flex-col"
            style={{
              maxWidth: 360,
              maxHeight: "75vh",
              borderRadius: "var(--radius)",
              border: "1px solid var(--line)",
              background: "var(--surface)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* Header */}
            <div
              className="relative px-5 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div>
                <div className="mono text-[9px] uppercase tracking-[0.18em] mb-0.5" style={{ color: "var(--txt-mute)" }}>
                  Sélection
                </div>
                <div className="font-semibold text-[17px]" style={{ color: "var(--txt)" }}>
                  Choisir une option
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  color: "var(--txt-mute)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--clinic-tint)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--clinic)";
                  (e.currentTarget as HTMLElement).style.color = "var(--clinic)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                  (e.currentTarget as HTMLElement).style.color = "var(--txt-mute)";
                }}
              >
                <XCircle size={16} />
              </button>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--line) transparent" }}>
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (opt.disabled) return;
                      if (onChange) onChange({ target: { value: opt.value } } as any);
                      setOpen(false);
                    }}
                    className="group w-full text-left flex items-center justify-between gap-3 rounded-xl transition-all cursor-pointer mb-1"
                    style={{
                      padding: "11px 14px",
                      background: isSelected ? "var(--clinic-tint)" : "transparent",
                      border: `1px solid ${isSelected ? "color-mix(in srgb, var(--clinic) 30%, transparent)" : "transparent"}`,
                      opacity: opt.disabled ? 0.4 : 1,
                      cursor: opt.disabled ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !opt.disabled) {
                        (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--line-2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                      }
                    }}
                  >
                    {/* Bullet indicator */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="shrink-0 rounded-full transition-all"
                        style={{
                          width: 6,
                          height: 6,
                          background: isSelected ? "var(--clinic)" : "var(--txt-mute)",
                        }}
                      />
                      <span
                        className="font-semibold text-[14px] truncate"
                        style={{ color: isSelected ? "var(--txt)" : "var(--txt-dim)" }}
                      >
                        {opt.label}
                      </span>
                    </div>

                    {isSelected && (
                      <div
                        className="shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: 20,
                          height: 20,
                          background: "var(--clinic-tint)",
                          border: "1px solid color-mix(in srgb, var(--clinic) 40%, transparent)",
                        }}
                      >
                        <Check size={11} style={{ color: "var(--clinic)" }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer note */}
            <div
              className="px-5 py-3 mono text-[10px] text-center"
              style={{ color: "var(--txt-mute)", borderTop: "1px solid var(--line)" }}
            >
              Appuyez sur <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>ESC</kbd> pour fermer
            </div>
          </div>
        </div>,
        document.body
      )}
      <select value={value} onChange={onChange} className="hidden" {...props}>
        {children}
      </select>
    </div>
  );
}


