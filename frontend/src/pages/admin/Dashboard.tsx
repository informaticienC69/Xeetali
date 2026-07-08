// Dashboard.tsx — Command Center Admin XÉÉTALI
// Inspiré fidèlement de maquette.html · Logic inchangée
import { useEffect, useState } from "react";
import {
  AlertTriangle, ArrowLeftRight, Bell, Building2,
  Droplet, HeartPulse, Inbox, ShieldCheck,
  Thermometer, Users, Wifi, Check, X
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

// ── SystemBar ─────────────────────────────────────────────────
// Style fidèle à maquette.html ligne 424–456
function SystemBar({ alertCount }: { alertCount: number }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("fr-FR", { hour12: false });
  const date = now.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div
      className="flex items-center justify-between px-5 py-2.5 shrink-0"
      style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <StatusDot color="var(--blood)" pulse />
          <span className="syne font-extrabold tracking-[0.18em] text-sm" style={{ color: "var(--txt)" }}>
            XÉÉTALI
          </span>
          <span className="mono text-[10px] uppercase" style={{ color: "var(--txt-mute)" }}>
            // délivrance · v1.4.0
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 mono text-[11px]" style={{ color: "var(--txt-dim)" }}>
          <span>SYS</span>
          <span className="flex items-center gap-1" style={{ color: "var(--ok)" }}>
            <StatusDot color="var(--ok)" /> OPÉRATIONNEL
          </span>
          <span style={{ color: "var(--txt-mute)" }}>|</span>
          <Wifi size={11} /> <span style={{ color: "var(--ok)" }}>412/415</span>
          <span style={{ color: "var(--txt-mute)" }}>|</span>
          <ShieldCheck size={11} /> <span style={{ color: "var(--ok)" }}>SYNC</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mono text-[11px]">
        <div className="hidden sm:block uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>{date}</div>
        <div className="tabular-nums text-base font-medium" style={{ color: "var(--txt)" }}>{time}</div>
        {alertCount > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md mono text-[11px] font-semibold"
            style={{
              background: "rgba(230,57,70,0.12)",
              border: "1px solid rgba(230,57,70,0.4)",
              color: "var(--blood)",
            }}
          >
            <AlertTriangle size={12} />
            {alertCount} ALERTE{alertCount > 1 ? "S" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ticker ────────────────────────────────────────────────────
// Style fidèle à maquette.html ligne 729–744
const TICKER_ITEMS = [
  { icon: AlertTriangle, label: "PIKINE · O- épuisé · alerte régionale" },
  { icon: Thermometer,   label: "Glacière LR-04 · 6.4°C · seuil dépassé" },
  { icon: ShieldCheck,   label: "Bloc Hyperledger #84210 signé · 14ms" },
  { icon: Wifi,          label: "LoRaWAN · 412 capteurs · 99.2% uptime" },
  { icon: HeartPulse,    label: "Modèle LSTM · prédiction +47% Magal J+6" },
  { icon: Users,         label: "1 284 donneurs mobilisables Dakar" },
];

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      className="overflow-hidden py-1.5 shrink-0"
      style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}
    >
      <div className="ticker-track mono text-[11px]" style={{ color: "var(--txt-mute)" }}>
        {doubled.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <it.icon size={11} style={{ color: "var(--blood)" }} />
            <span>{it.label}</span>
            <span className="mx-2" style={{ color: "var(--txt-mute)" }}>●</span>
          </span>
        ))}
      </div>
    </div>
  );
}


// ── AlertCenter ─────────────────────────────────────────────────────
function useElapsed(since: number) {
  const [elapsed, setElapsed] = useState(Date.now() - since);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - since), 10000);
    return () => clearInterval(t);
  }, [since]);
  const mins = Math.floor(elapsed / 60000);
  return mins < 1 ? "à l'instant" : `il y a ${mins} min`;
}

const NOW = Date.now();
const INCOMING = [
  { id: 1, hosp: "CHN Pikine",  group: "O-",  urgency: "critical" as const, since: NOW - 2 * 60 * 1000  },
  { id: 2, hosp: "HOGGY",       group: "O-",  urgency: "critical" as const, since: NOW - 5 * 60 * 1000  },
  { id: 3, hosp: "CHU Fann",   group: "AB+", urgency: "high"     as const, since: NOW - 11 * 60 * 1000 },
];

function AlertRow({ a }: { a: typeof INCOMING[0] }) {
  const when = useElapsed(a.since);
  const isCrit = a.urgency === "critical";
  const [routed, setRouted] = useState(false);
  return (
    <div
      className="alert-item px-3 py-3 flex items-center gap-3 rounded-xl mx-0 cursor-default"
      style={{
        borderBottom: "1px solid var(--line)",
        background: isCrit ? "rgba(230,57,70,0.03)" : "transparent",
      }}
    >
      {/* Indicateur urgence */}
      <div
        className={`w-1 self-stretch rounded-full shrink-0 ${isCrit ? "pulse-soft" : ""}`}
        style={{ background: isCrit ? "var(--blood)" : "var(--warn)", minHeight: 40 }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="syne font-semibold text-sm truncate" style={{ color: "var(--txt)" }}>{a.hosp}</span>
          {/* Badge groupe + urgence */}
          <span
            className="mono text-[10px] px-1.5 py-0.5 rounded-md border shrink-0"
            style={{
              background: isCrit ? "rgba(230,57,70,0.12)" : "rgba(245,158,11,0.10)",
              color: isCrit ? "var(--blood)" : "var(--warn)",
              borderColor: isCrit ? "rgba(230,57,70,0.4)" : "rgba(245,158,11,0.35)",
            }}
          >
            {a.group}
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
          {when} · besoin : <strong style={{ color: "var(--txt-dim)" }}>4 poches</strong>
        </div>
      </div>
      <button
        onClick={() => setRouted(true)}
        disabled={routed}
        className="mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all duration-150 shrink-0"
        style={{
          borderColor: routed ? "var(--ok)" : isCrit ? "rgba(230,57,70,0.5)" : "var(--line)",
          color: routed ? "var(--ok)" : isCrit ? "var(--blood)" : "var(--txt-mute)",
          background: routed ? "rgba(74,222,128,0.08)" : isCrit ? "rgba(230,57,70,0.06)" : "transparent",
        }}
      >
        {routed ? <><Check size={12} className="mr-1" /> Routé</> : "Router →"}
      </button>
    </div>
  );
}

function AlertCenter({ alertCount }: { alertCount: number }) {
  const [launched, setLaunched] = useState(false);
  const hasAlerts = alertCount > 0;

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
        className={`btn-blood w-full py-4 mb-4 flex items-center justify-center gap-3 text-base ${!launched ? "pulse-blood" : ""}`}
      >
        <Bell size={20} className={!launched ? "bell-shake" : ""} />
        <span className="tracking-widest">
          {launched ? "ALERTE NATIONALE EN COURS — ● ACTIF" : "LANCER ALERTE NATIONALE"}
        </span>
      </button>

      {/* Liste demandes */}
      <div className="flex-1 overflow-auto no-scrollbar space-y-1">
        {INCOMING.map((a, i) => (
          <div key={a.id} className="card-in" style={{ animationDelay: `${i * 80}ms` }}>
            <AlertRow a={a} />
          </div>
        ))}
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
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <SystemBar alertCount={data?.alertes_actives ?? 0} />
      <Ticker />

      <div className="flex-1 overflow-auto no-scrollbar">
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

          {/* Footer */}
          <div className="text-center mono text-[10px] py-4" style={{ color: "var(--txt-mute)" }}>
            XÉÉTALI · CNTS Sénégal · Données hébergées à Diamniadio · Conforme CDP loi 2008-12
          </div>
        </div>
      </div>
    </div>
  );
}
