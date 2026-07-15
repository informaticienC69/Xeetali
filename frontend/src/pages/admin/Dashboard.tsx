// Dashboard.tsx — Command Center Admin XÉÉTALI
// Inspiré fidèlement de maquette.html · Logic inchangée
import {
  ArrowLeftRight, Bell, Building2,
  Droplet, HeartPulse, Inbox,
  Thermometer, Users,
} from "lucide-react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { KpiTile, Skeleton } from "../../components/ui";
import { SenegalMap } from "../../components/SenegalMap";
import {
  ChartCard, DonutChart, HBarChart,
  TrendAreaChart, TrendLineChart,
  useChartColors, VBarChart,
} from "../../components/charts";

// ── Formatters ────────────────────────────────────────────────
const fmtDay   = (d: string) => { const [, m, day] = d.split("-"); return `${day}/${m}`; };
const MONTHS = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const fmtMonth = (d: string) => { const [, m] = d.split("-"); return MONTHS[Number(m) - 1] ?? d; };

// Tonalité d'une métrique « à surveiller » : reflète le compte réel plutôt
// qu'une valeur figée — sans ça, une tuile peut afficher « critique » avec
// pulsation alors que le compte est à 0 (c'est le bug corrigé ici : Alertes
// actives et Poches < 7 jours étaient toujours rouge/orange + pulsantes,
// quelle que soit la valeur réelle).
function concernTone(n: number): "ok" | "warn" {
  return n > 0 ? "warn" : "ok";
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { data, loading, error } = useApi(() => api.analytics(), []);
  const { series, status, urgence } = useChartColors();

  const kpis = data ? [
    { icon: Droplet,      label: "Poches disponibles",    value: data.total_poches_disponibles, tone: "normal" as const },
    { icon: Bell,         label: "Alertes actives",       value: data.alertes_actives,          tone: concernTone(data.alertes_actives),       pulse: data.alertes_actives > 0 },
    { icon: Users,        label: "Donneurs inscrits",     value: data.nb_donneurs,              tone: "ok"     as const },
    { icon: Thermometer,  label: "Poches < 7 jours",      value: data.poches_expirant_7j,       tone: concernTone(data.poches_expirant_7j),    pulse: data.poches_expirant_7j > 0 },
    { icon: ArrowLeftRight,label:"Transferts (total)",    value: data.total_transferts,         tone: "normal" as const },
    { icon: Inbox,        label: "Demandes ouvertes",     value: data.demandes_ouvertes,        tone: data.demandes_ouvertes > 5 ? "warn" as const : "normal" as const, pulse: data.demandes_ouvertes > 5 },
    { icon: HeartPulse,   label: "Dons (6 mois)",         value: data.dons_6_mois,              tone: "ok"     as const },
    { icon: Building2,    label: "Établissements",        value: data.nb_hopitaux,              tone: "normal" as const },
  ] : [];

  return (
    <div className="flex flex-col h-full relative" style={{ background: "var(--bg)" }}>
      <div className="relative z-10 flex flex-col h-full">

        <div className="flex-1 overflow-auto no-scrollbar relative z-10">
        {error && (
          <div className="mx-5 mt-4 rounded-xl px-4 py-3 mono text-[12px]"
               style={{ background: "rgba(206,51,65,0.08)", border: "1px solid rgba(206,51,65,0.35)", color: "var(--blood)" }}>
            {error}
          </div>
        )}

        <div className="p-5 space-y-5">
          {/* KPIs */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <>
              {/* Row 1 — 4 KPIs principaux */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {kpis.slice(0, 4).map((k) => (
                  <KpiTile key={k.label} icon={k.icon} label={k.label} value={k.value} tone={k.tone} pulse={k.pulse} />
                ))}
              </div>
              {/* Row 2 — 4 KPIs secondaires */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {kpis.slice(4).map((k) => (
                  <KpiTile key={k.label} icon={k.icon} label={k.label} value={k.value} tone={k.tone} pulse={k.pulse} />
                ))}
              </div>
            </>
          )}

          {/* Carte interactive — pleine largeur */}
          <SenegalMap
            alertesNationales={data?.alertes_actives ?? 12}
            totalPoches={data?.total_poches_disponibles ?? 1947}
            nbHopitaux={data?.nb_hopitaux ?? 28}
          />

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ChartCard title="Transferts par jour" subtitle="30 derniers jours" accent={series.aqua} live>
              {loading || !data ? <Skeleton className="h-60" /> :
                <TrendAreaChart data={data.transferts_par_jour} color={series.aqua} unit="transferts" tickFormatter={fmtDay} />}
            </ChartCard>
            <ChartCard title="Dons collectés par mois" subtitle="6 derniers mois" accent={series.orange}>
              {loading || !data ? <Skeleton className="h-60" /> :
                <TrendLineChart data={data.dons_par_mois} color={series.orange} unit="dons" tickFormatter={fmtMonth} />}
            </ChartCard>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Stock national par groupe sanguin" subtitle="Poches disponibles" accent={series.red}>
              {loading || !data ? <Skeleton className="h-60" /> :
                <VBarChart data={data.stock_par_groupe} color={series.red} unit="poches" />}
            </ChartCard>
            <ChartCard title="Répartition des poches par statut" subtitle="Ensemble du réseau" accent={status.DISPONIBLE}>
              {loading || !data ? <Skeleton className="h-60" /> :
                <DonutChart data={data.poches_par_statut} colors={status} centerLabel="poches" />}
            </ChartCard>
            <ChartCard title="Top établissements par stock" subtitle="Poches disponibles" accent={series.violet}>
              {loading || !data ? <Skeleton className="h-60" /> :
                <HBarChart data={data.stock_par_hopital} color={series.violet} unit="poches" />}
            </ChartCard>
            <ChartCard title="Donneurs inscrits par groupe" subtitle="Base donneurs" accent={series.blue}>
              {loading || !data ? <Skeleton className="h-60" /> :
                <VBarChart data={data.donneurs_par_groupe} color={series.blue} unit="donneurs" />}
            </ChartCard>
          </div>

          {/* Demandes urgence */}
          <ChartCard title="Demandes de sang par niveau d'urgence" subtitle="Toutes demandes" accent={urgence.CRITIQUE}>
            {loading || !data ? <Skeleton className="h-52" /> :
              <DonutChart data={data.demandes_par_urgence} colors={urgence} centerLabel="demandes" height={200} />}
          </ChartCard>

        </div>
      </div>
    </div>
    </div>
  );
}
