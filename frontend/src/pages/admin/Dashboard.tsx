import type { ComponentType } from "react";
import {
  ArrowLeftRight,
  Bell,
  Building2,
  Clock,
  Droplet,
  HeartPulse,
  Inbox,
  Users,
  type LucideProps,
} from "lucide-react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { Skeleton } from "../../components/ui";
import {
  ChartCard,
  DonutChart,
  HBarChart,
  TrendAreaChart,
  TrendLineChart,
  useChartColors,
  VBarChart,
} from "../../components/charts";

const fmtDay = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const fmtMonth = (d: string) => {
  const [, m] = d.split("-");
  return MONTHS[Number(m) - 1] ?? d;
};

interface Kpi {
  label: string;
  value: number;
  icon: ComponentType<LucideProps>;
  tint: string;
}

function KpiTile({ kpi }: { kpi: Kpi }) {
  const { label, value, icon: Icon, tint } = kpi;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: `${tint}1f`, color: tint }}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <div className="text-xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{value.toLocaleString("fr-FR")}</div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error } = useApi(() => api.analytics(), []);
  const { series, status, urgence } = useChartColors();

  const kpis: Kpi[] = data
    ? [
        { label: "Poches disponibles", value: data.total_poches_disponibles, icon: Droplet, tint: series.red },
        { label: "Transferts (total)", value: data.total_transferts, icon: ArrowLeftRight, tint: series.aqua },
        { label: "Dons (6 mois)", value: data.dons_6_mois, icon: HeartPulse, tint: series.orange },
        { label: "Donneurs inscrits", value: data.nb_donneurs, icon: Users, tint: series.blue },
        { label: "Demandes ouvertes", value: data.demandes_ouvertes, icon: Inbox, tint: status.DISPONIBLE },
        { label: "Poches < 7 jours", value: data.poches_expirant_7j, icon: Clock, tint: status.RESERVEE },
        { label: "Alertes actives", value: data.alertes_actives, icon: Bell, tint: status.PERIMEE },
        { label: "Établissements", value: data.nb_hopitaux, icon: Building2, tint: series.violet },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tableau de bord national</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Vue consolidée en temps réel — données issues de la base CNTS.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <KpiTile key={k.label} kpi={k} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Transferts par jour" subtitle="30 derniers jours">
          {loading || !data ? <Skeleton className="h-[240px]" /> : <TrendAreaChart data={data.transferts_par_jour} color={series.aqua} unit="transferts" tickFormatter={fmtDay} />}
        </ChartCard>
        <ChartCard title="Dons collectés par mois" subtitle="6 derniers mois">
          {loading || !data ? <Skeleton className="h-[240px]" /> : <TrendLineChart data={data.dons_par_mois} color={series.orange} unit="dons" tickFormatter={fmtMonth} />}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Stock national par groupe sanguin" subtitle="Poches disponibles">
          {loading || !data ? <Skeleton className="h-[240px]" /> : <VBarChart data={data.stock_par_groupe} color={series.red} unit="poches" />}
        </ChartCard>
        <ChartCard title="Répartition des poches par statut" subtitle="Ensemble du réseau">
          {loading || !data ? <Skeleton className="h-[240px]" /> : <DonutChart data={data.poches_par_statut} colors={status} centerLabel="poches" />}
        </ChartCard>
        <ChartCard title="Top établissements par stock" subtitle="Poches disponibles">
          {loading || !data ? <Skeleton className="h-[240px]" /> : <HBarChart data={data.stock_par_hopital} color={series.violet} unit="poches" />}
        </ChartCard>
        <ChartCard title="Donneurs inscrits par groupe" subtitle="Base donneurs">
          {loading || !data ? <Skeleton className="h-[240px]" /> : <VBarChart data={data.donneurs_par_groupe} color={series.blue} unit="donneurs" />}
        </ChartCard>
      </div>

      <ChartCard title="Demandes de sang par niveau d'urgence" subtitle="Toutes demandes">
        {loading || !data ? <Skeleton className="h-[200px]" /> : <DonutChart data={data.demandes_par_urgence} colors={urgence} centerLabel="demandes" height={200} />}
      </ChartCard>
    </div>
  );
}
