// ui.tsx — Composants Command Center XÉÉTALI
// Design inspiré de maquette.html · Light + Dark · Syne + DM Mono
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
import { BLOOD_GROUPS as BG_LIST, type BloodGroup as BG } from "../lib/api";

// ── CountUp hook (requestAnimationFrame) ─────────────────────────
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

export function useCountUp(target: number, duration = 1200, delay = 0): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start: number | null = null;
    const timeout = setTimeout(() => {
      function step(ts: number) {
        if (!start) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        setVal(Math.round(easeOut(progress) * target));
        if (progress < 1) raf.current = requestAnimationFrame(step);
        else setVal(target);
      }
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);
  return val;
}

export function CountUp({ value, duration, delay, className }: { value: number; duration?: number; delay?: number; className?: string }) {
  const v = useCountUp(value, duration, delay);
  return <span className={className}>{v.toLocaleString("fr-FR")}</span>;
}

// ── Skeleton (shimmer premium) ───────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={"rounded-xl shimmer " + className}
    />
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5}
      className="animate-spin"
      style={{ transformOrigin: "center" }}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

// ── KpiTile (premium avec barre accent) ─────────────────────────────────
const KPI_TONES = {
  normal: {
    bg:       "var(--surface)",
    border:   "var(--line)",
    bar:      "#94a3b8",
    accent:   "#64748b",
    numColor: "var(--txt)",
  },
  ok: {
    bg:       "var(--surface)",
    border:   "var(--line)",
    bar:      "#94a3b8",
    accent:   "#64748b",
    numColor: "var(--txt)",
  },
  warn: {
    bg:       "var(--surface)",
    border:   "rgba(217,119,6,0.3)",
    bar:      "#d97706",
    accent:   "#d97706",
    numColor: "var(--txt)",
  },
  crit: {
    bg:       "#fff1f2",
    border:   "rgba(230,57,70,0.35)",
    bar:      "#E63946",
    accent:   "#E63946",
    numColor: "#9f1239",
  },
} as const;

const KPI_TONES_DARK = {
  normal: {
    bg:       "var(--surface)",
    border:   "var(--line)",
    bar:      "#5b6685",
    accent:   "#93a0bf",
    numColor: "var(--txt)",
  },
  ok: {
    bg:       "var(--surface)",
    border:   "var(--line)",
    bar:      "#5b6685",
    accent:   "#93a0bf",
    numColor: "var(--txt)",
  },
  warn: {
    bg:       "rgba(245,158,11,0.07)",
    border:   "rgba(245,158,11,0.25)",
    bar:      "#f59e0b",
    accent:   "#f59e0b",
    numColor: "var(--txt)",
  },
  crit: {
    bg:       "rgba(230,57,70,0.07)",
    border:   "rgba(230,57,70,0.35)",
    bar:      "#E63946",
    accent:   "#E63946",
    numColor: "var(--txt)",
  },
} as const;
type KpiTone = keyof typeof KPI_TONES;

export function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "normal",
  pulse = false,
  delay = 0,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: number | string;
  sub?: string;
  tone?: KpiTone;
  pulse?: boolean;
  delay?: number;
}) {
  const animated = typeof value === "number" ? value : 0;
  const display = useCountUp(animated, 1200, delay);
  const shown = typeof value === "number" ? display.toLocaleString("fr-FR") : value;
  const lm = KPI_TONES[tone];
  const dm = KPI_TONES_DARK[tone];

  return (
    <div
      className={`card-in surface relative overflow-hidden chart-card-hover kpi-tile-${tone}-${delay}`}
      style={{
        padding: 18,
        paddingTop: 22,
        animationDelay: `${delay}ms`,
        background: lm.bg,
        borderColor: lm.border,
      }}
    >
      {/* Dark mode override via injected style */}
      <style>{`
        .dark .kpi-tile-${tone}-${delay} {
          background: ${dm.bg} !important;
          border-color: ${dm.border} !important;
        }
        .dark .kpi-tile-${tone}-${delay} .kpi-num { color: ${dm.numColor} !important; }
        .dark .kpi-tile-${tone}-${delay} .kpi-accent { color: ${dm.accent} !important; }
      `}</style>

      {/* Barre d'accent top colorée */}
      <div
        className={`absolute top-0 left-0 right-0 pointer-events-none ${tone === "crit" || tone === "warn" ? (pulse ? "accent-pulse" : "") : ""}`}
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${lm.bar} 0%, ${lm.bar}88 60%, transparent 100%)`,
          borderRadius: "12px 12px 0 0",
        }}
      />

      <div className="relative flex items-start justify-between">
        <div className="mono uppercase text-[10px] tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
          {label}
        </div>
        <div
          className={`kpi-accent ${pulse ? "pulse-soft" : ""}`}
          style={{ color: lm.accent }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div className="relative mt-3 flex items-baseline gap-2">
        <div
          className="kpi-num syne font-extrabold text-[34px] leading-none"
          style={{ color: lm.numColor }}
        >
          {shown}
        </div>
        {sub && <div className="mono text-[11px]" style={{ color: "var(--txt-mute)" }}>{sub}</div>}
      </div>
    </div>
  );
}

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
    <section className={`card-in surface overflow-hidden ${className}`} style={{ padding: 18 }}>
      {(title || subtitle || action) && (
        <header className="flex items-start justify-between mb-4">
          <div>
            {subtitle && (
              <div className="mono uppercase text-[10px] tracking-[0.14em] mb-0.5" style={{ color: "var(--txt-mute)" }}>
                {subtitle}
              </div>
            )}
            {title && (
              <h3 className="syne font-bold text-lg leading-tight" style={{ color: "var(--txt)" }}>
                {title}
              </h3>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

// ── PageHeader ────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<LucideProps>;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 page-title-glow">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg relative overflow-hidden"
             style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.35)" }}>
          <div className="absolute inset-0 pulse-soft" style={{ background: "radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)" }} />
          <Icon size={18} style={{ color: "var(--blood)", position: "relative" }} />
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>{subtitle}</div>
          <h1 className="syne font-bold text-xl" style={{ color: "var(--txt)" }}>{title}</h1>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────────────
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  renderRow,
}: {
  columns: string[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  renderRow: (item: T, index: number) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
            {columns.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left" style={{ color: "var(--txt-mute)", fontWeight: 500 }}>
                <span className="mono text-[10px] uppercase tracking-[0.12em]">{h}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className="dt-row row-fade-in"
              style={{
                borderBottom: "1px solid var(--line)",
                animationDelay: `${Math.min(index * 40, 400)}ms`
              }}
            >
              {renderRow(item, index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────
type ButtonVariant = "blood" | "ghost" | "outline" | "secondary" | "danger";

export function Button({
  children,
  variant = "blood",
  loading,
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer";

  if (variant === "blood") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`btn-blood ${base} ${className}`}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  if (variant === "outline") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} border font-mono text-[11px] uppercase tracking-wider ${className}`}
        style={{
          borderColor: "var(--line)",
          color: "var(--txt-dim)",
          background: "transparent",
        }}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  if (variant === "secondary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} border mono text-[11px] uppercase tracking-wider ${className}`}
        style={{ borderColor: "var(--line)", color: "var(--txt-dim)", background: "var(--surface-2)" }}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  if (variant === "danger") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} border mono text-[11px] uppercase tracking-wider ${className}`}
        style={{ borderColor: "rgba(230,57,70,0.35)", color: "var(--blood)", background: "rgba(230,57,70,0.08)" }}
      >
        {loading && <Spinner size={15} />}
        {children}
      </button>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${className}`}
      style={{ color: "var(--txt-dim)", background: "transparent" }}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  );
}

// ── FilterSelect ──────────────────────────────────────────────────
export function FilterSelect({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      style={{ minWidth: 160 }}
    >
      {children}
    </Select>
  );
}

// ── Modal Command Center ──────────────────────────────────────────
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-pop surface w-full max-w-md relative overflow-hidden"
        style={{ padding: 24, maxHeight: "90vh", overflowY: "auto", borderRadius: 16, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ height: 3, background: "linear-gradient(90deg, var(--blood) 0%, rgba(230,57,70,0.2) 100%)" }}
        />
        <div className="flex items-center justify-between mb-5 relative">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>Formulaire</div>
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
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

// ── GroupBadge ────────────────────────────────────────────────────
export function GroupBadge({ groupe }: { groupe: string }) {
  return (
    <span
      className="mono text-[11px] px-2 py-0.5 rounded-md border font-bold"
      style={{
        background: "var(--surface-2)",
        color: "var(--txt-dim)",
        borderColor: "var(--line)",
      }}
    >
      {groupe}
    </span>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  DISPONIBLE: { bg: "var(--surface-2)",          color: "var(--txt-dim)",  border: "var(--line)",                label: "Disponible" },
  RESERVEE:   { bg: "rgba(217,119,6,0.08)",      color: "var(--warn)",    border: "rgba(217,119,6,0.3)",        label: "Réservée"   },
  UTILISEE:   { bg: "var(--surface-2)",          color: "var(--txt-mute)", border: "var(--line)",               label: "Utilisée"   },
  PERIMEE:    { bg: "rgba(230,57,70,0.10)",      color: "var(--blood)",   border: "rgba(230,57,70,0.35)",       label: "Périmée"    },
};

export function StatusBadge({ statut }: { statut: string }) {
  const s = STATUS_STYLES[statut] ?? { bg: "var(--surface-2)", color: "var(--txt-dim)", border: "var(--line)", label: statut };
  return (
    <span
      className="mono text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider font-medium"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {s.label}
    </span>
  );
}

// ── UrgencyBadge ─────────────────────────────────────────────────
const URGENCY_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  NORMALE:   { bg: "rgba(90,96,120,0.10)",   color: "var(--txt-mute)", border: "var(--line)"                  },
  URGENTE:   { bg: "rgba(217,119,6,0.10)",   color: "var(--warn)",    border: "rgba(217,119,6,0.35)"          },
  CRITIQUE:  { bg: "rgba(230,57,70,0.10)",   color: "var(--blood)",   border: "rgba(230,57,70,0.35)"          },
};

export function UrgencyBadge({ urgence }: { urgence: string }) {
  const u = URGENCY_STYLES[urgence] ?? URGENCY_STYLES.NORMALE;
  return (
    <span
      className="mono text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider font-medium"
      style={{ background: u.bg, color: u.color, borderColor: u.border }}
    >
      {urgence}
    </span>
  );
}

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
          borderColor: open ? "var(--blood)" : undefined,
          boxShadow: open ? "0 0 0 2px var(--blood-glow)" : undefined,
        }}
      >
        <span className="truncate syne font-medium">{selectedOption?.label || "Sélectionner..."}</span>
        <ChevronDown
          size={14}
          className={`chevron-rotate flex-shrink-0 transition-all ${open ? "open" : ""}`}
          style={{ color: open ? "var(--blood)" : "var(--txt-mute)" }}
        />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="modal-pop w-full overflow-hidden flex flex-col"
            style={{
              maxWidth: 360,
              maxHeight: "75vh",
              borderRadius: 20,
              border: "1px solid var(--blood-glow)",
              background: "var(--surface)",
              boxShadow: "0 0 0 1px var(--line), 0 32px 64px rgba(0,0,0,0.35), 0 0 60px var(--blood-glow)",
            }}
          >
            {/* Header */}
            <div
              className="relative px-5 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-6 right-6 rounded-b-full"
                style={{ height: 2, background: "linear-gradient(90deg, transparent, var(--blood) 40%, transparent)" }}
              />
              <div>
                <div className="mono text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ color: "var(--blood)" }}>
                  Sélection
                </div>
                <div className="syne font-bold text-[17px]" style={{ color: "var(--txt)" }}>
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
                  (e.currentTarget as HTMLElement).style.background = "rgba(230,57,70,0.15)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(230,57,70,0.4)";
                  (e.currentTarget as HTMLElement).style.color = "var(--blood)";
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
                      background: isSelected
                        ? "linear-gradient(90deg, rgba(230,57,70,0.15) 0%, rgba(230,57,70,0.05) 100%)"
                        : "transparent",
                      border: `1px solid ${isSelected ? "rgba(230,57,70,0.3)" : "transparent"}`,
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
                        className="flex-shrink-0 rounded-full transition-all"
                        style={{
                          width: 6,
                          height: 6,
                          background: isSelected ? "var(--blood)" : "var(--txt-mute)",
                          boxShadow: isSelected ? "0 0 8px var(--blood-glow)" : "none",
                        }}
                      />
                      <span
                        className="syne font-semibold text-[14px] truncate"
                        style={{ color: isSelected ? "var(--txt)" : "var(--txt-dim)" }}
                      >
                        {opt.label}
                      </span>
                    </div>

                    {isSelected && (
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: 20,
                          height: 20,
                          background: "rgba(230,57,70,0.2)",
                          border: "1px solid rgba(230,57,70,0.4)",
                        }}
                      >
                        <Check size={11} style={{ color: "var(--blood)" }} />
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

// ── Toolbar ───────────────────────────────────────────────────────
export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {children}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="mono text-[12px]" style={{ color: "var(--txt-mute)" }}>{message}</p>
    </div>
  );
}

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
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => <ToastItem key={t.id} entry={t} onDone={() => remove(t.id)} />)}
    </div>
  );
}

// ── BloodGroupSelector ────────────────────────────────────────────
// Sélecteur visuel premium de groupe sanguin (grille 4×2)

export function BloodGroupSelector({
  value,
  onChange,
}: {
  value: BG;
  onChange: (g: BG) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BG_LIST.map((g) => {
        const isSelected = g === value;
        const isNeg = g.includes("-");
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className="relative flex flex-col items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
            style={{
              padding: "10px 6px",
              background: isSelected
                ? "linear-gradient(135deg, rgba(230,57,70,0.25) 0%, rgba(230,57,70,0.10) 100%)"
                : "var(--surface-2)",
              border: `2px solid ${isSelected ? "var(--blood)" : "var(--line)"}`,
              boxShadow: isSelected
                ? "0 0 0 1px rgba(230,57,70,0.2), 0 4px 12px rgba(230,57,70,0.25)"
                : "none",
              transform: isSelected ? "scale(1.04)" : "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(230,57,70,0.45)";
                (e.currentTarget as HTMLElement).style.background = "rgba(230,57,70,0.07)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              }
            }}
          >
            <span
              className="mono text-[8px] font-bold mb-0.5 uppercase tracking-wider"
              style={{ color: isNeg ? "var(--warn)" : "var(--ok)", opacity: 0.8 }}
            >
              {isNeg ? "RH\u2212" : "RH+"}
            </span>
            <span
              className="syne font-extrabold text-base leading-none"
              style={{ color: isSelected ? "var(--blood)" : "var(--txt)" }}
            >
              {g.replace(/[+-]/, "")}
            </span>
            {isSelected && (
              <span
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full scale-bounce"
                style={{ background: "var(--blood)" }}
              >
                <Check size={9} className="text-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── UrgencySelector ────────────────────────────────────────────────
const URGENCY_CONFIG = [
  { value: "NORMALE",  label: "Normale",  sub: "Délai standard", color: "var(--txt-mute)", bgActive: "rgba(90,96,120,0.20)",  borderActive: "rgba(90,96,120,0.55)"  },
  { value: "URGENTE",  label: "Urgente",  sub: "Sous 24h",        color: "var(--warn)",     bgActive: "rgba(217,119,6,0.15)",  borderActive: "rgba(217,119,6,0.55)"  },
  { value: "CRITIQUE", label: "Critique", sub: "Immédiat",        color: "var(--blood)",    bgActive: "rgba(230,57,70,0.15)",  borderActive: "rgba(230,57,70,0.55)"  },
] as const;

export function UrgencySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {URGENCY_CONFIG.map((u) => {
        const isSelected = u.value === value;
        return (
          <button
            key={u.value}
            type="button"
            onClick={() => onChange(u.value)}
            className="flex flex-col items-center justify-center rounded-xl transition-all duration-150 cursor-pointer relative overflow-hidden"
            style={{
              padding: "12px 8px",
              background: isSelected ? u.bgActive : "var(--surface-2)",
              border: `2px solid ${isSelected ? u.borderActive : "var(--line)"}`,
              transform: isSelected ? "scale(1.03)" : "scale(1)",
              boxShadow: isSelected ? `0 4px 16px ${u.color}30` : "none",
            }}
          >
            {u.value === "CRITIQUE" && isSelected && (
              <span
                className="absolute inset-0 pointer-events-none pulse-soft"
                style={{ background: `radial-gradient(circle at center, rgba(230,57,70,0.15) 0%, transparent 70%)` }}
              />
            )}
            <span className="syne font-bold text-sm" style={{ color: isSelected ? u.color : "var(--txt-dim)" }}>
              {u.label}
            </span>
            <span
              className="mono text-[9px] mt-0.5 uppercase tracking-wider"
              style={{ color: isSelected ? u.color : "var(--txt-mute)", opacity: 0.8 }}
            >
              {u.sub}
            </span>
          </button>
        );
      })}
    </div>
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
