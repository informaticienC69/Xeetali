// charts.tsx — Command Center palette · Light + Dark · PREMIUM v2
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, Cell, CartesianGrid,
  LabelList, Line, LineChart, Pie, PieChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useTheme } from "../lib/theme";
import type { LabeledCount, TimePoint } from "../lib/api";

// ── Palette Command Center ─────────────────────────────────────
const PALETTE = {
  light: {
    series:  { red: "#E63946", blue: "#2563eb", violet: "#7c3aed", aqua: "#0891b2", orange: "#ea580c" },
    status:  { DISPONIBLE: "#16a34a", RESERVEE: "#d97706", UTILISEE: "#6b7280", PERIMEE: "#E63946" },
    urgence: { NORMALE: "#6b7280", URGENTE: "#d97706", CRITIQUE: "#E63946" },
    grid: "rgba(29,53,87,0.10)",
    axis: "#8a96b8",
    tooltipBg: "#ffffff",
    tooltipBorder: "rgba(29,53,87,0.15)",
    tooltipTitle: "#0f1629",
    tooltipValue: "#4a5578",
    cursor: "rgba(29,53,87,0.04)",
    donutStroke: "#f0f2f8",
    label: "#8a96b8",
    hbarLabel: "#4a5578",
    trackBg: "rgba(29,53,87,0.08)",
    refLine: "rgba(29,53,87,0.25)",
  },
  dark: {
    series:  { red: "#E63946", blue: "#60a5fa", violet: "#a78bfa", aqua: "#34d399", orange: "#fb923c" },
    status:  { DISPONIBLE: "#4ade80", RESERVEE: "#f59e0b", UTILISEE: "#94a3b8", PERIMEE: "#E63946" },
    urgence: { NORMALE: "#94a3b8", URGENTE: "#f59e0b", CRITIQUE: "#E63946" },
    grid: "rgba(31,42,74,0.60)",
    axis: "#5b6685",
    tooltipBg: "#0e1428",
    tooltipBorder: "#2a3863",
    tooltipTitle: "#E6ECF5",
    tooltipValue: "#93a0bf",
    cursor: "rgba(255,255,255,0.03)",
    donutStroke: "#0A0F1E",
    label: "#5b6685",
    hbarLabel: "#93a0bf",
    trackBg: "rgba(255,255,255,0.04)",
    refLine: "rgba(255,255,255,0.18)",
  },
};

function useChart() {
  const { resolved } = useTheme();
  return PALETTE[resolved];
}

export function useChartColors() {
  const c = useChart();
  return { series: c.series, status: c.status, urgence: c.urgence };
}

/* ── Tooltip Command Center ───────────────────────────────────── */
function CcTooltip({
  active, payload, label, unit,
}: {
  active?: boolean;
  payload?: { value: number; name?: string; payload?: { label?: string }; color?: string }[];
  label?: string | number;
  unit?: string;
}) {
  const c = useChart();
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const title = p.payload?.label ?? label ?? p.name;
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{
        background: c.tooltipBg,
        border: `1px solid ${c.tooltipBorder}`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.30)`,
        fontFamily: "'DM Mono', monospace",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        className="font-semibold mb-2 text-[10px] uppercase tracking-widest"
        style={{ color: c.tooltipTitle }}
      >
        {title}
      </div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 tabular-nums" style={{ color: c.tooltipValue }}>
          {entry.color && <span className="h-2.5 w-2.5 rounded-sm inline-block shrink-0" style={{ background: entry.color }} />}
          <span className="font-bold text-sm" style={{ color: c.tooltipTitle }}>
            {entry.value.toLocaleString("fr-FR")}
          </span>
          {unit && <span className="opacity-60 text-[10px]">{unit}</span>}
        </div>
      ))}
    </div>
  );
}

/* ── ChartCard ────────────────────────────────────────────────── */
export function ChartCard({
  title, subtitle, children, action, accent, live = false, badge,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  /** Hex couleur pour la barre d'accent et le glow hover */
  accent?: string;
  /** Dot vert "TEMPS RÉEL" pulsant */
  live?: boolean;
  /** Métrique/badge optionnel dans le header */
  badge?: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <section
      className="card-in surface relative overflow-hidden chart-card-hover"
      style={{
        padding: 20,
        borderColor: hovered && accent ? `${accent}55` : undefined,
        boxShadow: hovered && accent
          ? `0 8px 32px ${accent}18, 0 0 0 1px ${accent}30`
          : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Barre d'accent top */}
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${accent} 0%, ${accent}88 55%, transparent 100%)`,
            borderRadius: "12px 12px 0 0",
          }}
        />
      )}
      {/* Micro-gradient fond */}
      {accent && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at top left, ${accent}08 0%, transparent 65%)`,
            borderRadius: 12,
          }}
        />
      )}
      <header className="relative mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {subtitle && (
              <div className="mono uppercase text-[10px] tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
                {subtitle}
              </div>
            )}
            {live && (
              <span className="flex items-center gap-1">
                <span
                  className="pulse-soft h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--ok)", boxShadow: "0 0 6px var(--ok)" }}
                />
                <span className="mono text-[9px] uppercase tracking-widest" style={{ color: "var(--ok)" }}>live</span>
              </span>
            )}
          </div>
          <h3 className="syne font-bold text-lg leading-tight" style={{ color: "var(--txt)" }}>{title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {action}
        </div>
      </header>
      {children}
    </section>
  );
}

/* ── VBarChart ────────────────────────────────────────────────── */
export function VBarChart({ data, color, unit, height = 240 }: { data: LabeledCount[]; color: string; unit?: string; height?: number }) {
  const c = useChart();
  const maxVal = Math.max(...data.map(d => d.value));
  const avg = data.length ? data.reduce((s, d) => s + d.value, 0) / data.length : 0;
  return (
    <div className="chart-fade-up">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 24, right: 12, bottom: 0, left: -18 }}>
          <defs>
            {data.map((d, i) => (
              <linearGradient key={i} id={`vbar-${color.replace("#","")}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={d.value === maxVal ? 1 : 0.85} />
                <stop offset="100%" stopColor={color} stopOpacity={0.38} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="2 4" />
          <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 11, fontFamily: "'DM Mono',monospace" }} tickLine={false} axisLine={{ stroke: c.grid }} />
          <YAxis tick={{ fill: c.axis, fontSize: 11, fontFamily: "'DM Mono',monospace" }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <Tooltip cursor={{ fill: c.cursor, radius: 6 }} content={<CcTooltip unit={unit} />} />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke={c.refLine}
              strokeDasharray="4 3"
              label={{ value: "MOY.", position: "insideTopRight", fill: c.label, fontSize: 9, fontFamily: "'DM Mono',monospace" }}
            />
          )}
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={44}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={`url(#vbar-${color.replace("#","")}-${i})`}
                style={d.value === maxVal ? { filter: `drop-shadow(0 0 6px ${color}80)` } : undefined}
              />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              style={{ fill: c.label, fontSize: 11, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── HBarChart ────────────────────────────────────────────────── */
const RANK_COLORS = ["#f59e0b", "#94a3b8", "#c2855b", "#6b7280", "#6b7280"];
const RANK_LABELS = ["#1", "#2", "#3", "#4", "#5"];

export function HBarChart({ data, color, unit }: { data: LabeledCount[]; color: string; unit?: string; height?: number }) {
  const c = useChart();
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="chart-fade-up space-y-3" style={{ paddingTop: 4 }}>
      {data.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        const isTop = i < 3;
        return (
          <div key={d.label} className="group">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="mono text-[10px] font-bold tabular-nums shrink-0"
                style={{ color: RANK_COLORS[i] ?? "#6b7280", width: 22 }}
              >
                {RANK_LABELS[i] ?? `#${i + 1}`}
              </span>
              <span
                className="mono text-[11px] flex-1 truncate"
                style={{ color: c.hbarLabel, fontWeight: isTop ? 600 : 400 }}
                title={d.label}
              >
                {d.label}
              </span>
              <span
                className="mono text-[12px] font-bold tabular-nums shrink-0"
                style={{ color: isTop ? "var(--txt)" : c.label }}
              >
                {d.value.toLocaleString("fr-FR")}
                {unit && <span className="text-[10px] font-normal ml-1" style={{ color: c.label }}>{unit}</span>}
              </span>
            </div>
            <div
              className="relative rounded-full overflow-hidden"
              style={{ height: 7, background: c.trackBg, marginLeft: 24 }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${pct}%`,
                  background: i === 0
                    ? `linear-gradient(90deg, ${color} 0%, ${color}bb 100%)`
                    : `linear-gradient(90deg, ${color}99 0%, ${color}55 100%)`,
                  boxShadow: i === 0 ? `0 0 8px ${color}60` : undefined,
                  transition: "width 1.2s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── DonutChart ──────────────────────────────────────────────────── */
export function DonutChart({ data, colors, centerLabel, height = 220 }: { data: LabeledCount[]; colors: Record<string, string>; centerLabel?: string; height?: number }) {
  const c = useChart();
  const total = data.reduce((a, d) => a + d.value, 0);
  const shown = data.filter((d) => d.value > 0);
  const maxEntry = shown.length ? shown.reduce((a, b) => (b.value > a.value ? b : a)) : null;

  // État du segment survolé — utilisé pour le centre et la légende
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredEntry = hovered ? data.find(d => d.label === hovered) : null;

  // Valeurs affichées dans le centre
  const centerValue = hoveredEntry ? hoveredEntry.value : total;
  const centerTop = hoveredEntry ? hoveredEntry.label : centerValue.toLocaleString("fr-FR");
  const centerSub = hoveredEntry
    ? `${Math.round((hoveredEntry.value / total) * 100)}%`
    : centerLabel;
  const centerColor = hoveredEntry ? (colors[hoveredEntry.label] ?? "#94a3b8") : undefined;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row chart-fade-up">
      {/* Donut */}
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={shown}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={3}
              stroke={c.donutStroke}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              onMouseEnter={(entry: { name?: string }) => setHovered(entry.name ?? null)}
              onMouseLeave={() => setHovered(null)}
            >
              {shown.map((d) => {
                const isHov = hovered === d.label;
                const isDominant = !hovered && maxEntry && d.label === maxEntry.label;
                const col = colors[d.label] ?? "#94a3b8";
                return (
                  <Cell
                    key={d.label}
                    fill={col}
                    opacity={hovered ? (isHov ? 1 : 0.45) : (isDominant ? 1 : 0.82)}
                    style={
                      isHov || isDominant
                        ? { filter: `drop-shadow(0 0 8px ${col}90)`, cursor: "pointer" }
                        : { cursor: "pointer" }
                    }
                  />
                );
              })}
            </Pie>
            {/* Pas de <Tooltip> Recharts — il se positionnait dans le trou du donut */}
          </PieChart>
        </ResponsiveContainer>

        {/* Centre dynamique */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {hoveredEntry ? (
            <>
              <span
                className="mono text-[10px] uppercase tracking-widest mb-1 transition-all duration-150"
                style={{ color: centerColor }}
              >
                {centerTop}
              </span>
              <span
                className="syne text-3xl font-extrabold tabular-nums leading-none transition-all duration-150"
                style={{ color: centerColor }}
              >
                {hoveredEntry.value.toLocaleString("fr-FR")}
              </span>
              <span
                className="mono text-[13px] font-bold mt-1"
                style={{ color: centerColor, opacity: 0.85 }}
              >
                {centerSub}
              </span>
            </>
          ) : (
            <>
              <span
                className="syne text-3xl font-extrabold tabular-nums leading-none"
                style={{ color: "var(--txt)" }}
              >
                {total.toLocaleString("fr-FR")}
              </span>
              {centerLabel && (
                <span
                  className="mono text-[10px] mt-1 uppercase tracking-widest"
                  style={{ color: "var(--txt-mute)" }}
                >
                  {centerLabel}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Légende premium avec % */}
      <ul className="flex-1 space-y-2 w-full">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const col = colors[d.label] ?? "#94a3b8";
          const isDominant = !hovered && maxEntry && d.label === maxEntry.label;
          const isHov = hovered === d.label;
          return (
            <li
              key={d.label}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-150 cursor-default"
              style={{
                background: isHov ? `${col}20` : isDominant ? `${col}12` : "transparent",
                border: isHov
                  ? `1px solid ${col}55`
                  : isDominant
                  ? `1px solid ${col}30`
                  : "1px solid transparent",
                opacity: hovered && !isHov ? 0.55 : 1,
              }}
              onMouseEnter={() => setHovered(d.label)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{
                  background: col,
                  boxShadow: isHov || isDominant ? `0 0 8px ${col}90` : undefined,
                }}
              />
              <span
                className="mono text-[11px] flex-1 uppercase tracking-wider"
                style={{
                  color: isHov || isDominant ? "var(--txt-dim)" : "var(--txt-mute)",
                  fontWeight: isHov || isDominant ? 600 : 400,
                }}
              >
                {d.label}
              </span>
              <span
                className="tabular-nums syne font-bold text-sm"
                style={{ color: isHov || isDominant ? "var(--txt)" : "var(--txt-dim)" }}
              >
                {d.value}
              </span>
              {/* Pill pourcentage */}
              <span
                className="mono text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-lg"
                style={{ background: `${col}22`, color: col, minWidth: 38, textAlign: "center" }}
              >
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


/* ── GlowDot ────────────────────────────────────────────────── */
function GlowDot(props: {
  cx?: number; cy?: number; r?: number; fill?: string; stroke?: string;
}) {
  const { cx = 0, cy = 0, r = 5, fill = "#fff", stroke = "#fff" } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 5} fill={fill} opacity={0.12} />
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={2} />
    </g>
  );
}

/* ── TrendAreaChart ──────────────────────────────────────────────── */
export function TrendAreaChart({ data, color, unit, tickFormatter, height = 240 }: { data: TimePoint[]; color: string; unit?: string; tickFormatter?: (v: string) => string; height?: number }) {
  const c = useChart();
  const gid = `grad-area-${color.replace("#","")}`;
  const avg = data.length ? data.reduce((s, d) => s + d.value, 0) / data.length : 0;
  return (
    <div className="chart-fade-up">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.65} />
              <stop offset="60%"  stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="2 4" />
          <XAxis dataKey="date" tick={{ fill: c.axis, fontSize: 11, fontFamily: "'DM Mono',monospace" }} tickLine={false} axisLine={{ stroke: c.grid }} tickFormatter={tickFormatter} minTickGap={24} />
          <YAxis tick={{ fill: c.axis, fontSize: 11, fontFamily: "'DM Mono',monospace" }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <Tooltip content={<CcTooltip unit={unit} />} labelFormatter={(v) => tickFormatter ? tickFormatter(String(v)) : v} />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke={c.refLine}
              strokeDasharray="4 3"
              label={{ value: "MOY.", position: "insideTopRight", fill: c.label, fontSize: 9, fontFamily: "'DM Mono',monospace" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fill={`url(#${gid})`}
            dot={false}
            activeDot={<GlowDot fill={color} stroke="var(--surface)" r={5} />}
            style={{ filter: `drop-shadow(0 2px 6px ${color}55)` }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── TrendLineChart ──────────────────────────────────────────────── */
export function TrendLineChart({ data, color, unit, tickFormatter, height = 240 }: { data: TimePoint[]; color: string; unit?: string; tickFormatter?: (v: string) => string; height?: number }) {
  const c = useChart();
  const avg = data.length ? data.reduce((s, d) => s + d.value, 0) / data.length : 0;
  return (
    <div className="chart-fade-up">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="2 4" />
          <XAxis dataKey="date" tick={{ fill: c.axis, fontSize: 11, fontFamily: "'DM Mono',monospace" }} tickLine={false} axisLine={{ stroke: c.grid }} tickFormatter={tickFormatter} minTickGap={16} />
          <YAxis tick={{ fill: c.axis, fontSize: 11, fontFamily: "'DM Mono',monospace" }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <Tooltip content={<CcTooltip unit={unit} />} labelFormatter={(v) => tickFormatter ? tickFormatter(String(v)) : v} />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke={c.refLine}
              strokeDasharray="4 3"
              label={{ value: "MOY.", position: "insideTopRight", fill: c.label, fontSize: 9, fontFamily: "'DM Mono',monospace" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={<GlowDot fill={color} stroke="var(--surface)" r={4} />}
            activeDot={<GlowDot fill={color} stroke="var(--surface)" r={6} />}
            style={{ filter: `drop-shadow(0 2px 6px ${color}55)` }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
