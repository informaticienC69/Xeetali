// MedicalDashboard.tsx — Tableau de bord Personnel Médical "World-Class"
// Landing page /medical — Vision en temps réel de l'hôpital
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Droplet,
  ShieldCheck,
  Syringe,
  ChevronRight,
  Zap,
} from "lucide-react";
import { api, BLOOD_GROUPS, type BloodGroup, type HospitalInventory } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { Card, KpiTile, GroupBadge, UrgencyBadge, Skeleton } from "../../components/ui";

// ── Animation des nombres (CountUp) ──────────────────────────────────
function CountUp({ end, delay }: { end: number; delay: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (end === 0) return;
    let start: number | null = null;
    let req: number;
    const duration = 1200; // 1.2s
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4); // Quartic ease out
      setVal(Math.floor(easeOut * end));
      if (progress < 1) req = requestAnimationFrame(step);
      else setVal(end);
    };
    const t = setTimeout(() => {
      req = requestAnimationFrame(step);
    }, delay + 50);
    return () => {
      clearTimeout(t);
      if (req) cancelAnimationFrame(req);
    };
  }, [end, delay]);
  return <>{val}</>;
}

// ── Carte hexagonale de stock par groupe sanguin (arc SVG) ────────────
const IDEAL_STOCK = 50; // seuil de stock idéal (= barre pleine à 100%)

function BloodGroupCard({
  groupe,
  count,
  delay,
}: {
  groupe: BloodGroup;
  count: number;
  delay: number;
}) {
  const pct = Math.min(Math.round((count / IDEAL_STOCK) * 100), 100);
  const state = count === 0 ? "empty" : count <= 5 ? "low" : "ok";

  const theme = {
    empty: {
      stroke: "#E63946",
      textColor: "#E63946",
      bg: "rgba(230,57,70,0.08)",
      border: "rgba(230,57,70,0.35)",
      label: "RUPTURE",
      labelBg: "rgba(230,57,70,0.15)",
    },
    low: {
      stroke: "#d97706",
      textColor: "#d97706",
      bg: "rgba(217,119,6,0.06)",
      border: "rgba(217,119,6,0.25)",
      label: "FAIBLE",
      labelBg: "rgba(217,119,6,0.12)",
    },
    ok: {
      stroke: "#16a34a",
      textColor: "var(--ok)",
      bg: "var(--surface-2)",
      border: "var(--line)",
      label: "OK",
      labelBg: "rgba(22,163,74,0.10)",
    },
  }[state];

  // Arc SVG (demi-cercle) : viewBox=" 0 0 60 34" — tracez un arc dans la partie supérieure
  const R = 24;
  const CX = 30;
  const CY = 30;
  const fullArc = Math.PI * R;           // périmètre demi-cercle
  const filled = (pct / 100) * fullArc;  // longueur remplie

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), delay + 50);
    return () => clearTimeout(t);
  }, [delay]);

  const currentFilled = isMounted ? filled : 0;

  return (
    <div
      className="card-in flex flex-col items-center gap-1.5 rounded-2xl px-3 pt-3 pb-2.5 cursor-default transition-all duration-200 hover:scale-[1.03] hover:shadow-md relative overflow-hidden"
      style={{
        animationDelay: `${delay}ms`,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
      }}
    >
      {/* Pulsation pour rupture */}
      {state === "empty" && (
        <span className="absolute inset-0 rounded-2xl pulse-blood pointer-events-none" style={{ opacity: 0.4 }} />
      )}

      {/* Arc de jauge SVG */}
      <div className="relative" style={{ width: 60, height: 34 }}>
        <svg viewBox="0 0 60 34" width="60" height="34" style={{ overflow: "visible" }}>
          {/* Piste de fond */}
          <path
            d={`M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`}
            fill="none"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Arc rempli */}
          {pct > 0 && (
            <path
              d={`M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`}
              fill="none"
              stroke={theme.stroke}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${currentFilled} ${fullArc}`}
              style={{
                filter: state === "empty" ? `drop-shadow(0 0 4px ${theme.stroke})` : "none",
                transition: "stroke-dasharray 1.2s cubic-bezier(0.165, 0.84, 0.44, 1)",
              }}
            />
          )}
        </svg>
        {/* Pourcentage centré dans l'arc */}
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 mono font-bold text-[10px] leading-none"
          style={{ color: "var(--txt-mute)" }}
        >
          {state === "empty" ? "0%" : <><CountUp end={pct} delay={delay} />%</>}
        </span>
      </div>

      {/* Nom du groupe */}
      <span
        className="syne font-black text-xl leading-none tracking-tight"
        style={{ color: theme.textColor }}
      >
        {groupe}
      </span>

      {/* Quantité */}
      <span
        className="syne font-black text-3xl leading-none"
        style={{ color: theme.textColor }}
      >
        <CountUp end={count} delay={delay} />
      </span>
      <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
        {count <= 1 ? "poche" : "poches"}
      </span>

      {/* Badge d'état */}
      <span
        className="mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
        style={{ color: theme.stroke, background: theme.labelBg }}
      >
        {state === "empty" && <AlertTriangle size={9} />}
        {state === "low" && <Zap size={9} />}
        {theme.label}
      </span>
    </div>
  );
}

// ── Carte d'action rapide ─────────────────────────────────────────
function QuickActionCard({
  icon: Icon,
  label,
  sub,
  to,
  tone,
  delay,
}: {
  icon: typeof Droplet;
  label: string;
  sub: string;
  to: string;
  tone: "blood" | "ok" | "warn";
  delay: number;
}) {
  const navigate = useNavigate();
  const colors = {
    blood: { bg: "rgba(230,57,70,0.10)", border: "rgba(230,57,70,0.30)", color: "var(--blood)", hover: "rgba(230,57,70,0.18)" },
    ok:    { bg: "rgba(22,163,74,0.10)",   border: "rgba(22,163,74,0.30)",   color: "var(--ok)",   hover: "rgba(22,163,74,0.18)"   },
    warn:  { bg: "rgba(217,119,6,0.10)",   border: "rgba(217,119,6,0.30)",   color: "var(--warn)", hover: "rgba(217,119,6,0.18)"   },
  };
  const c = colors[tone];

  return (
    <button
      onClick={() => navigate(to)}
      className="card-in w-full text-left flex items-center gap-4 rounded-xl transition-all duration-200 cursor-pointer group"
      style={{
        padding: "14px 18px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = c.hover;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${c.color}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = c.bg;
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${c.color}20`, border: `1px solid ${c.color}40` }}
      >
        <Icon size={18} style={{ color: c.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="syne font-bold text-sm" style={{ color: "var(--txt)" }}>
          {label}
        </div>
        <div className="mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--txt-mute)" }}>
          {sub}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
        <span className="mono text-[10px] uppercase font-bold" style={{ color: c.color }}>Accéder</span>
        <ChevronRight size={14} className="shrink-0" style={{ color: c.color }} />
      </div>
    </button>
  );
}

// ── Composant principal ────────────────────────────────────────────
export default function MedicalDashboard() {
  const { hospitalId, nom } = useAuth();
  const inv = useApi(() => api.inventory(), []);
  const requests = useApi(() => api.listRequests(), []);

  const prenom = (nom ?? "").split(" ")[0];

  // Stock de l'hôpital connecté
  const myHospital = useMemo<HospitalInventory | null>(() => {
    if (!inv.data || !hospitalId) return null;
    return inv.data.find((h) => h.hospital_id === hospitalId) ?? null;
  }, [inv.data, hospitalId]);

  // Stock par groupe pour cet hôpital
  const stockByGroup = useMemo(() => {
    const map: Record<BloodGroup, number> = {} as any;
    BLOOD_GROUPS.forEach((g) => (map[g] = 0));
    if (myHospital) {
      myHospital.stocks.forEach((s) => { map[s.groupe_sanguin as BloodGroup] = s.quantite; });
    }
    return map;
  }, [myHospital]);

  const maxStock = useMemo(
    // 50 poches = objectif de stock idéal. La barre sera calculée par rapport à ça (ou plus si surplus).
    () => Math.max(...Object.values(stockByGroup), 50),
    [stockByGroup],
  );

  const totalDispo = useMemo(
    () => Object.values(stockByGroup).reduce((a, b) => a + b, 0),
    [stockByGroup],
  );

  // KPIs demandes
  const { openReqs, criticalReqs } = useMemo(() => {
    const all = requests.data ?? [];
    return {
      openReqs:     all.filter((r) => r.statut === "OUVERTE").length,
      criticalReqs: all.filter((r) => r.statut === "OUVERTE" && r.urgence === "CRITIQUE").length,
      urgentReqs:   all.filter((r) => r.statut === "OUVERTE" && r.urgence === "URGENTE").length,
    };
  }, [requests.data]);

  // 5 dernières demandes ouvertes, les critiques en premier
  const recentRequests = useMemo(() => {
    return (requests.data ?? [])
      .filter((r) => r.statut === "OUVERTE")
      .sort((a, b) => {
        const priority = { CRITIQUE: 0, URGENTE: 1, NORMALE: 2 };
        return (priority[a.urgence as keyof typeof priority] ?? 2) - (priority[b.urgence as keyof typeof priority] ?? 2);
      })
      .slice(0, 5);
  }, [requests.data]);

  const groupsAlerts = useMemo(
    () => BLOOD_GROUPS.filter((g) => stockByGroup[g] === 0),
    [stockByGroup],
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="space-y-6">
      {/* ── En-tête salutation ── */}
      <div className="card-in flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.14em] mb-1" style={{ color: "var(--txt-mute)" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
          <h1 className="syne font-extrabold text-2xl page-title-glow" style={{ color: "var(--txt)" }}>
            {greeting},{" "}
            <span style={{ color: "var(--blood)" }}>{prenom || "Docteur"}</span>
          </h1>
          {myHospital && (
            <div className="mono text-[11px] mt-0.5" style={{ color: "var(--txt-mute)" }}>
              {myHospital.nom} · {myHospital.localisation}
            </div>
          )}
        </div>

        {criticalReqs > 0 && (
          <div
            className="pulse-blood flex items-center gap-2 rounded-xl px-4 py-2"
            style={{
              background: "rgba(230,57,70,0.12)",
              border: "1px solid rgba(230,57,70,0.45)",
            }}
          >
            <AlertTriangle size={16} className="pulse-soft" style={{ color: "var(--blood)" }} />
            <span className="mono text-[11px] font-bold" style={{ color: "var(--blood)" }}>
              {criticalReqs} demande{criticalReqs > 1 ? "s" : ""} CRITIQUE{criticalReqs > 1 ? "S" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          icon={Droplet}
          label="Poches disponibles"
          value={totalDispo}
          sub="hôpital"
          tone={totalDispo === 0 ? "crit" : totalDispo <= 10 ? "warn" : "ok"}
          pulse={totalDispo <= 5}
          delay={0}
        />
        <KpiTile
          icon={ClipboardList}
          label="Demandes ouvertes"
          value={openReqs}
          tone={openReqs > 0 ? "warn" : "normal"}
          delay={60}
        />
        <KpiTile
          icon={Activity}
          label="Demandes critiques"
          value={criticalReqs}
          tone={criticalReqs > 0 ? "crit" : "normal"}
          pulse={criticalReqs > 0}
          delay={120}
        />
        <KpiTile
          icon={Clock}
          label="Groupes en rupture"
          value={groupsAlerts.length}
          sub={groupsAlerts.length > 0 ? groupsAlerts.join(", ") : ""}
          tone={groupsAlerts.length > 0 ? "crit" : "normal"}
          pulse={groupsAlerts.length > 0}
          delay={180}
        />
      </div>

      {/* ── Contenu principal ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Stock par groupe sanguin ── */}
        <Card
          title="Stock · Hôpital"
          subtitle="Poches disponibles par groupe"
          className="lg:col-span-1 h-full"
          action={
            groupsAlerts.length > 0 ? (
              <span
                className="mono text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider font-bold pulse-soft"
                style={{
                  color: "var(--blood)",
                  background: "rgba(230,57,70,0.10)",
                  borderColor: "rgba(230,57,70,0.35)",
                }}
              >
                {groupsAlerts.length} rupture{groupsAlerts.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span
                className="mono text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider font-bold"
                style={{ color: "var(--ok)", background: "rgba(22,163,74,0.10)", borderColor: "rgba(22,163,74,0.35)" }}
              >
                Nominal
              </span>
            )
          }
        >
          {inv.loading ? (
            <div className="flex-1 flex flex-col justify-between gap-4">
              {/* Squelette de la grille 4x2 */}
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((g) => (
                  <Skeleton key={g} className="h-[148px] rounded-2xl" />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {/* Squelette des totaux */}
                <Skeleton className="h-[52px] rounded-2xl" />

                {/* Squelette de la synthèse */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-[12px] w-24 rounded-md opacity-50" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-[72px] rounded-xl" />
                    <Skeleton className="h-[72px] rounded-xl" />
                    <Skeleton className="h-[72px] rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-4">
              {/* Grille 4x2 de cartes */}
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((g, i) => (
                  <BloodGroupCard
                    key={g}
                    groupe={g}
                    count={stockByGroup[g]}
                    delay={i * 40}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {/* Totaux */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: "var(--surface-2)" }}
                >
                  <span className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>Total disponible</span>
                  <span className="syne font-black text-2xl" style={{ color: totalDispo === 0 ? "var(--blood)" : totalDispo <= 10 ? "var(--warn)" : "var(--ok)" }}>
                    {totalDispo}
                    <span className="syne font-semibold text-sm ml-1.5" style={{ color: "var(--txt-mute)" }}>poches</span>
                  </span>
                </div>

                {/* Synthèse de santé du stock */}
                <div className="flex flex-col gap-2">
                  <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Santé du stock</span>
                  {(() => {
                    const nbOk    = BLOOD_GROUPS.filter(g => stockByGroup[g] > 5).length;
                    const nbLow   = BLOOD_GROUPS.filter(g => stockByGroup[g] > 0 && stockByGroup[g] <= 5).length;
                    const nbEmpty = BLOOD_GROUPS.filter(g => stockByGroup[g] === 0).length;
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
                          <span className="syne font-black text-2xl" style={{ color: "var(--ok)" }}>{nbOk}</span>
                          <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "#16a34a" }}>OK</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)" }}>
                          <span className="syne font-black text-2xl" style={{ color: "var(--warn)" }}>{nbLow}</span>
                          <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--warn)" }}>Faibles</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ background: "rgba(230,57,70,0.08)", border: `1px solid ${nbEmpty > 0 ? "rgba(230,57,70,0.35)" : "rgba(230,57,70,0.1)"}` }}>
                          <span className={`syne font-black text-2xl ${nbEmpty > 0 ? "pulse-soft" : ""}`} style={{ color: "var(--blood)" }}>{nbEmpty}</span>
                          <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--blood)" }}>Rupture</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ── Colonne droite : demandes + actions rapides ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Demandes urgentes ── */}
          <Card
            title="Demandes ouvertes"
            subtitle="Triées par priorité"
            action={
              <span className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
                {openReqs} total
              </span>
            }
          >
            {requests.loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-center">
                <CheckCircle2 size={28} style={{ color: "var(--ok)" }} />
                <p className="mono text-[12px]" style={{ color: "var(--txt-mute)" }}>
                  Aucune demande ouverte
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((r, i) => {
                  const isCrit = r.urgence === "CRITIQUE";
                  const isUrg  = r.urgence === "URGENTE";
                  return (
                    <div
                      key={r.id}
                      className="card-in flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                      style={{
                        animationDelay: `${i * 60}ms`,
                        background: isCrit
                          ? "rgba(230,57,70,0.06)"
                          : isUrg
                            ? "rgba(217,119,6,0.06)"
                            : "var(--surface-2)",
                        border: `1px solid ${isCrit ? "rgba(230,57,70,0.25)" : isUrg ? "rgba(217,119,6,0.20)" : "var(--line)"}`,
                        boxShadow: isCrit ? "inset 3px 0 0 var(--blood)" : isUrg ? "inset 3px 0 0 var(--warn)" : "none",
                      }}
                    >
                      {isCrit && (
                        <AlertTriangle size={14} className="shrink-0 pulse-soft" style={{ color: "var(--blood)" }} />
                      )}
                      <GroupBadge groupe={r.groupe_sanguin} />
                      <span className="syne font-bold text-sm" style={{ color: "var(--txt)" }}>
                        {r.quantite} poche{r.quantite > 1 ? "s" : ""}
                      </span>
                      <span className="flex-1" />
                      <UrgencyBadge urgence={r.urgence} />
                      <span className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
                        {new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── Actions rapides ── */}
          <Card title="Actions rapides" subtitle="Accès direct">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <QuickActionCard
                icon={Droplet}
                label="Nouvelle poche"
                sub="Enregistrement"
                to="/medical/register"
                tone="blood"
                delay={0}
              />
              <QuickActionCard
                icon={ShieldCheck}
                label="Vérifier UID"
                sub="Contrôle qualité"
                to="/medical/validity"
                tone="ok"
                delay={60}
              />
              <QuickActionCard
                icon={Syringe}
                label="Demande de sang"
                sub="Urgences"
                to="/medical/request"
                tone="warn"
                delay={120}
              />
            </div>
          </Card>

        </div>
      </div>

      <div className="flex items-center gap-4 py-2">
        <span className="h-1.5 w-1.5 rounded-full pulse-soft" style={{ background: "var(--ok)", boxShadow: "0 0 8px var(--ok)" }} />
        <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
          Données actualisées · {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
