// MedicalDashboard.tsx — Tableau de bord Personnel Médical "World-Class"
// Landing page /medical — Vision en temps réel de l'hôpital
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Droplet,
  FileCheck,
  ShieldCheck,
  Syringe,
  TrendingDown,
  Zap,
} from "lucide-react";
import { api, BLOOD_GROUPS, type BloodGroup, type HospitalInventory } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { Card, KpiTile, GroupBadge, UrgencyBadge, Skeleton } from "../../components/ui";

// ── Mini barre de stock par groupe sanguin ─────────────────────────
function BloodStockBar({
  groupe,
  count,
  max,
  delay,
}: {
  groupe: BloodGroup;
  count: number;
  max: number;
  delay: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  // Couleur = signal uniquement, pas décoration
  const tone =
    count === 0 ? "var(--blood)" : count <= 3 ? "var(--warn)" : "var(--txt-dim)";
  const bgTone =
    count === 0
      ? "rgba(230,57,70,0.08)"
      : count <= 3
        ? "rgba(217,119,6,0.07)"
        : "var(--surface-2)";
  const borderTone =
    count === 0
      ? "rgba(230,57,70,0.30)"
      : count <= 3
        ? "rgba(217,119,6,0.25)"
        : "var(--line)";
  const barColor =
    count === 0
      ? "linear-gradient(90deg, var(--blood), rgba(230,57,70,0.4))"
      : count <= 3
        ? "linear-gradient(90deg, var(--warn), rgba(217,119,6,0.5))"
        : "linear-gradient(90deg, #94a3b8, #64748b88)";

  return (
    <div
      className="card-in flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        animationDelay: `${delay}ms`,
        background: bgTone,
        border: `1px solid ${borderTone}`,
      }}
    >
      {/* Badge groupe */}
      <span
        className="syne font-black text-sm w-9 shrink-0 text-center rounded-lg py-1"
        style={{
          background: count === 0 ? "rgba(230,57,70,0.12)" : "var(--surface)",
          color: tone,
        }}
      >
        {groupe}
      </span>

      {/* Barre de progression */}
      <div className="flex-1 flex flex-col gap-1">
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 4, background: "rgba(148,163,184,0.15)" }}
        >
          <div
            className="h-full rounded-full progress-fill"
            style={{
              width: `${pct}%`,
              background: barColor,
              boxShadow: count === 0 ? "0 0 6px rgba(230,57,70,0.5)" : "none",
              animationDelay: `${delay + 200}ms`,
            }}
          />
        </div>
      </div>

      {/* Compteur */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="syne font-black text-lg w-8 text-right leading-none"
          style={{ color: tone }}
        >
          {count}
        </span>
        {count === 0 ? (
          <TrendingDown size={12} className="pulse-soft" style={{ color: "var(--blood)" }} />
        ) : (
          <span className="mono text-[9px] w-6 text-right" style={{ color: "var(--txt-mute)" }}>
            {pct}%
          </span>
        )}
      </div>
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
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${c.color}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = c.bg;
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
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
      <Zap size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: c.color }} />
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
    () => Math.max(...Object.values(stockByGroup), 1),
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
          className="lg:col-span-1"
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
            <div className="space-y-2">
              {BLOOD_GROUPS.map((g) => <Skeleton key={g} className="h-10 rounded-xl" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {BLOOD_GROUPS.map((g, i) => (
                <BloodStockBar
                  key={g}
                  groupe={g}
                  count={stockByGroup[g]}
                  max={maxStock}
                  delay={i * 50}
                />
              ))}

              {/* Totaux */}
              <div
                className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
              >
                <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Total disponible</span>
                <span className="syne font-black text-xl" style={{ color: totalDispo === 0 ? "var(--blood)" : totalDispo <= 10 ? "var(--warn)" : "var(--ok)" }}>
                  {totalDispo}
                  <span className="syne font-normal text-xs ml-1" style={{ color: "var(--txt-mute)" }}>poches</span>
                </span>
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

      {/* ── Footer statut ── */}
      <div className="flex items-center gap-4 py-2">
        <span className="h-1.5 w-1.5 rounded-full pulse-soft" style={{ background: "var(--ok)", boxShadow: "0 0 8px var(--ok)" }} />
        <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
          Données actualisées · {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="ml-auto mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
          <FileCheck size={10} className="inline mr-1" style={{ color: "var(--ok)" }} />
          Hyperledger SYNC
        </span>
      </div>
    </div>
  );
}
