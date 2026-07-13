// Dashboard.tsx — Command Center Admin XÉÉTALI
// Inspiré fidèlement de maquette.html · Logic inchangée
import { useEffect, useState } from "react";
import {
  ArrowLeftRight, Bell, Building2,
  Droplet, HeartPulse, Inbox,
  Thermometer, Users, Check, X
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

// ── StatusDot ─────────────────────────────────────────────────
function StatusDot({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return (
    <span
      className={pulse ? "pulse-soft" : ""}
      style={{
        display: "inline-block", width: 8, height: 8,
        borderRadius: 9999, background: color,
        boxShadow: `0 0 8px ${color}`, flexShrink: 0,
      }}
    />
  );
}

// ── AlertCenter ─────────────────────────────────────────────────────
function useElapsed(since: string) {
  const [elapsed, setElapsed] = useState(Date.now() - new Date(since).getTime());
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - new Date(since).getTime()), 10000);
    return () => clearInterval(t);
  }, [since]);
  const mins = Math.floor(elapsed / 60000);
  return mins < 1 ? "à l'instant" : `il y a ${mins} min`;
}

function AlertRow({ a, onRouted }: { a: any, onRouted: () => void }) {
  const when = useElapsed(a.created_at);
  const isCrit = a.urgence === "CRITIQUE";
  const [routed, setRouted] = useState(false);
  
  async function handleRoute() {
    try {
      setRouted(true);
      await api.updateRequest(a.id, { statut: "EN_COURS" });
      onRouted();
    } catch (err) {
      setRouted(false);
      console.error(err);
    }
  }

  return (
    <div
      className="alert-item px-4 py-3 flex items-center gap-4 rounded-xl mx-0 cursor-default mb-2"
      style={{
        border: "1px solid var(--line)",
        background: isCrit ? "rgba(230,57,70,0.03)" : "var(--surface)",
      }}
    >
      {/* Indicateur urgence */}
      <div
        className={`w-1 self-stretch rounded-full shrink-0 ${isCrit ? "pulse-soft" : ""}`}
        style={{ background: isCrit ? "var(--blood)" : "var(--warn)", minHeight: 40 }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="syne font-semibold text-sm truncate" style={{ color: "var(--txt)" }}>{a.nom_hopital || "Hôpital inconnu"}</span>
          {/* Badge groupe + urgence */}
          <span
            className="mono text-[10px] px-1.5 py-0.5 rounded-md border shrink-0"
            style={{
              background: isCrit ? "rgba(230,57,70,0.12)" : "rgba(245,158,11,0.10)",
              color: isCrit ? "var(--blood)" : "var(--warn)",
              borderColor: isCrit ? "rgba(230,57,70,0.4)" : "rgba(245,158,11,0.35)",
            }}
          >
            {a.groupe_sanguin}
          </span>
          <span
            className="mono text-[9px] px-1.5 py-0.5 rounded-md shrink-0"
            style={{
              background: isCrit ? "rgba(230,57,70,0.08)" : "rgba(245,158,11,0.08)",
              color: isCrit ? "var(--blood)" : "var(--warn)",
            }}
          >
            {isCrit ? "CRITIQUE" : "HAUTE"}
          </span>
        </div>
        <div className="mono text-[10px] mt-0.5" style={{ color: "var(--txt-mute)" }}>
          {when} · besoin : <strong style={{ color: "var(--txt-dim)" }}>{a.quantite} poche{a.quantite > 1 ? "s" : ""}</strong>
        </div>
      </div>
      <button
        onClick={handleRoute}
        disabled={routed}
        className="mono text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg border transition-all duration-150 shrink-0 cursor-pointer hover:shadow-sm"
        style={{
          borderColor: routed ? "var(--ok)" : isCrit ? "rgba(230,57,70,0.5)" : "var(--line)",
          color: routed ? "var(--ok)" : isCrit ? "var(--blood)" : "var(--txt)",
          background: routed ? "rgba(74,222,128,0.08)" : isCrit ? "rgba(230,57,70,0.06)" : "var(--surface-2)",
        }}
      >
        {routed ? <><Check size={12} className="mr-1 inline-block" /> Routé</> : "Router →"}
      </button>
    </div>
  );
}

function AlertCenter({ alertCount }: { alertCount: number }) {
  const [launched, setLaunched] = useState(false);
  const hasAlerts = alertCount > 0;
  const requests = useApi(() => api.listRequests(), []);
  
  const incoming = (requests.data || []).filter((r: any) => r.statut === "OUVERTE").sort((a: any, b: any) => {
    const pA = a.urgence === "CRITIQUE" ? 0 : a.urgence === "URGENTE" ? 1 : 2;
    const pB = b.urgence === "CRITIQUE" ? 0 : b.urgence === "URGENTE" ? 1 : 2;
    return pA - pB;
  }).slice(0, 5);

  return (
    <div
      className="surface flex flex-col card-in"
      style={{
        padding: 20,
        minHeight: 340,
        borderColor: hasAlerts ? "rgba(230,57,70,0.35)" : undefined,
        background: hasAlerts ? "rgba(230,57,70,0.02)" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="mono uppercase text-[10px] tracking-[0.14em] flex items-center gap-2" style={{ color: "var(--txt-mute)" }}>
            Centre d’Alertes
            {hasAlerts && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md mono text-[9px] font-bold pulse-soft"
                style={{ background: "rgba(230,57,70,0.15)", color: "var(--blood)" }}
              >
                ● {alertCount} ACTIVE{alertCount > 1 ? "S" : ""}
              </span>
            )}
          </div>
          <div className="syne text-lg font-bold mt-0.5" style={{ color: "var(--txt)" }}>Demandes Entrantes</div>
        </div>
        <span className="mono text-[10px] flex items-center gap-1" style={{ color: "var(--txt-mute)" }}>
          <span className="pulse-soft h-1.5 w-1.5 rounded-full" style={{ background: "var(--ok)", boxShadow: "0 0 5px var(--ok)" }} />
          FLUX TEMPS RÉEL
        </span>
      </div>

      {/* Bouton ALERTE NATIONALE */}
      <button
        onClick={() => setLaunched(true)}
        disabled={launched}
        className={`btn-blood w-full py-4 mb-4 flex items-center justify-center gap-3 text-base cursor-pointer transition-all hover:opacity-90 hover:shadow-xl ${!launched ? "pulse-blood" : ""}`}
      >
        <Bell size={20} className={!launched ? "bell-shake" : ""} />
        <span className="tracking-widest">
          {launched ? "ALERTE NATIONALE EN COURS — ● ACTIF" : "LANCER ALERTE NATIONALE"}
        </span>
      </button>

      {/* Liste demandes */}
      <div className="flex-1 overflow-auto no-scrollbar space-y-1">
        {incoming.map((a: any, i: number) => (
          <div key={a.id} className="card-in" style={{ animationDelay: `${i * 80}ms` }}>
            <AlertRow a={a} onRouted={() => requests.reload()} />
          </div>
        ))}
        {incoming.length === 0 && !requests.loading && (
          <div className="text-center mono text-[11px] text-gray-500 py-4">Aucune demande en attente.</div>
        )}
      </div>

      {alertCount > 0 && (
        <div className="mt-4 mono text-[10px] text-center py-2 rounded-lg" style={{ color: "var(--blood)", background: "rgba(230,57,70,0.06)" }}>
            <X size={14} className="mr-1 inline-block" /> {alertCount} alerte(s) active(s) dans le système
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { data, loading, error } = useApi(() => api.analytics(), []);
  const { series, status, urgence } = useChartColors();

  const kpis = data ? [
    { icon: Droplet,      label: "Poches disponibles",    value: data.total_poches_disponibles, sub: "/ pays",          tone: "normal" as const },
    { icon: Bell,         label: "Alertes actives",       value: data.alertes_actives,          sub: "critiques",       tone: "crit"   as const, pulse: true },
    { icon: Users,        label: "Donneurs inscrits",     value: data.nb_donneurs,              sub: "zone réseau",     tone: "ok"     as const },
    { icon: Thermometer,  label: "Poches < 7 jours",      value: data.poches_expirant_7j,       sub: "seuil urgent",    tone: "warn"   as const, pulse: true },
    { icon: ArrowLeftRight,label:"Transferts (total)",    value: data.total_transferts,         sub: undefined,         tone: "normal" as const },
    { icon: Inbox,        label: "Demandes ouvertes",     value: data.demandes_ouvertes,        sub: undefined,         tone: data.demandes_ouvertes > 5 ? "warn" as const : "normal" as const },
    { icon: HeartPulse,   label: "Dons (6 mois)",         value: data.dons_6_mois,             sub: undefined,         tone: "ok"     as const },
    { icon: Building2,    label: "Établissements",        value: data.nb_hopitaux,              sub: undefined,         tone: "normal" as const },
  ] : [];

  return (
    <div className="flex flex-col h-full relative" style={{ background: "var(--bg)" }}>
      <div className="relative z-10 flex flex-col h-full">

        <div className="flex-1 overflow-auto no-scrollbar relative z-10">
        {error && (
          <div className="mx-5 mt-4 rounded-xl px-4 py-3 mono text-[12px]"
               style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.35)", color: "var(--blood)" }}>
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
                {kpis.slice(0, 4).map((k, i) => (
                  <KpiTile key={k.label} icon={k.icon} label={k.label} value={k.value} sub={k.sub} tone={k.tone} pulse={k.pulse} delay={i * 80} />
                ))}
              </div>
              {/* Row 2 — 4 KPIs secondaires */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {kpis.slice(4).map((k, i) => (
                  <KpiTile key={k.label} icon={k.icon} label={k.label} value={k.value} sub={k.sub} tone={k.tone} delay={(i + 4) * 80} />
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

          {/* Centre d'alertes */}
          <AlertCenter alertCount={data?.alertes_actives ?? 0} />

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
