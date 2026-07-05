// Graphes (Recharts) — palette validée (dataviz), thème clair & sombre.
// Marques fines, extrémités arrondies, grille discrète, tooltip au survol.
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../lib/theme";
import type { LabeledCount, TimePoint } from "../lib/api";

// Couleurs de séries + statut + urgence, par thème (validées validate_palette.js).
const PALETTE = {
  light: {
    series: { red: "#dc2626", blue: "#2a78d6", violet: "#4a3aa7", aqua: "#1baf7a", orange: "#eb6834" },
    status: { DISPONIBLE: "#0ca30c", RESERVEE: "#fab219", UTILISEE: "#898781", PERIMEE: "#d03b3b" },
    urgence: { NORMALE: "#64748b", URGENTE: "#fab219", CRITIQUE: "#d03b3b" },
    grid: "#e1e0d9",
    axis: "#898781",
    tooltipBg: "#ffffff",
    tooltipBorder: "rgba(11,11,11,0.10)",
    tooltipTitle: "#334155",
    tooltipValue: "#64748b",
    cursor: "rgba(0,0,0,0.04)",
    donutStroke: "#ffffff",
    label: "#94a3b8",
    hbarLabel: "#475569",
  },
  dark: {
    series: { red: "#f87171", blue: "#60a5fa", violet: "#a78bfa", aqua: "#34d399", orange: "#fb923c" },
    status: { DISPONIBLE: "#0ca30c", RESERVEE: "#fab219", UTILISEE: "#898781", PERIMEE: "#d03b3b" },
    urgence: { NORMALE: "#94a3b8", URGENTE: "#fab219", CRITIQUE: "#f87171" },
    grid: "#2c2c2a",
    axis: "#8a8a86",
    tooltipBg: "#1e293b",
    tooltipBorder: "rgba(255,255,255,0.12)",
    tooltipTitle: "#e2e8f0",
    tooltipValue: "#94a3b8",
    cursor: "rgba(255,255,255,0.05)",
    donutStroke: "#0f172a",
    label: "#64748b",
    hbarLabel: "#cbd5e1",
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

function TooltipBox({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number; name?: string; payload?: { label?: string } }[];
  label?: string | number;
  unit?: string;
}) {
  const c = useChart();
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const title = p.payload?.label ?? label ?? p.name;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-md"
      style={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}` }}
    >
      <div className="font-medium" style={{ color: c.tooltipTitle }}>{title}</div>
      <div className="mt-0.5 tabular-nums" style={{ color: c.tooltipValue }}>
        {p.value.toLocaleString("fr-FR")} {unit ?? ""}
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function VBarChart({ data, color, unit, height = 240 }: { data: LabeledCount[]; color: string; unit?: string; height?: number }) {
  const c = useChart();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} />
        <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip cursor={{ fill: c.cursor }} content={<TooltipBox unit={unit} />} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HBarChart({ data, color, unit, height = 240 }: { data: LabeledCount[]; color: string; unit?: string; height?: number }) {
  const c = useChart();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke={c.grid} />
        <XAxis type="number" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={{ fill: c.hbarLabel, fontSize: 12 }} tickLine={false} axisLine={false} width={140} />
        <Tooltip cursor={{ fill: c.cursor }} content={<TooltipBox unit={unit} />} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey="value" position="right" fill={c.label} fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, colors, centerLabel, height = 240 }: { data: LabeledCount[]; colors: Record<string, string>; centerLabel?: string; height?: number }) {
  const c = useChart();
  const total = data.reduce((a, d) => a + d.value, 0);
  const shown = data.filter((d) => d.value > 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="relative w-full sm:w-1/2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={shown} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke={c.donutStroke} strokeWidth={2}>
              {shown.map((d) => (
                <Cell key={d.label} fill={colors[d.label] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip content={<TooltipBox unit="poches" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{total}</span>
          {centerLabel && <span className="text-[11px] text-slate-400 dark:text-slate-500">{centerLabel}</span>}
        </div>
      </div>
      <ul className="w-full space-y-1.5 text-sm sm:w-1/2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[d.label] ?? "#94a3b8" }} />
              {d.label}
            </span>
            <span className="tabular-nums font-medium text-slate-700 dark:text-slate-200">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendAreaChart({ data, color, unit, tickFormatter, height = 240 }: { data: TimePoint[]; color: string; unit?: string; tickFormatter?: (v: string) => string; height?: number }) {
  const c = useChart();
  const gid = `grad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis dataKey="date" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} tickFormatter={tickFormatter} minTickGap={24} />
        <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip content={<TooltipBox unit={unit} />} labelFormatter={(v) => (tickFormatter ? tickFormatter(String(v)) : v)} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ data, color, unit, tickFormatter, height = 240 }: { data: TimePoint[]; color: string; unit?: string; tickFormatter?: (v: string) => string; height?: number }) {
  const c = useChart();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis dataKey="date" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} tickFormatter={tickFormatter} minTickGap={16} />
        <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip content={<TooltipBox unit={unit} />} labelFormatter={(v) => (tickFormatter ? tickFormatter(String(v)) : v)} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
