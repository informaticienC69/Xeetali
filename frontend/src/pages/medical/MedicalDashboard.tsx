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
import { Card, KpiTile, GroupBadge, UrgencyBadge, Skeleton, Button } from "../../components/ui";

// ── Carte de stock par groupe sanguin (design clinique) ────────────

function BloodGroupCard({
  groupe,
  count,
  idealStock,
  lowThreshold,
}: {
  groupe: BloodGroup;
  count: number;
  idealStock: number;
  lowThreshold: number;
}) {
  const pct = Math.min(Math.round((count / idealStock) * 100), 100);
  const state = count === 0 ? "empty" : count <= lowThreshold ? "low" : "ok";

  const theme = {
    empty: { stroke: "var(--crit)", label: "RUPTURE", icon: AlertTriangle },
    low:   { stroke: "var(--warn)", label: "FAIBLE", icon: Zap },
    ok:    { stroke: "var(--ok)",   label: "OK", icon: CheckCircle2 },
  }[state as "empty" | "low" | "ok"];

  const Icon = theme!.icon;

  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-3"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg leading-none" style={{ color: "var(--txt)" }}>{groupe}</span>
        <span className="flex items-center gap-1 mono text-[9px] font-bold uppercase tracking-wider" style={{ color: theme!.stroke }}>
          <Icon size={10} />
          {theme!.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="num font-bold text-2xl leading-none" style={{ color: "var(--txt)" }}>{count}</span>
        <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
          {count <= 1 ? "poche" : "poches"}
        </span>
      </div>
      {/* Barre de progression */}
      <div className="h-1.5 rounded-full mt-2" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: theme!.stroke
          }}
        />
      </div>
    </div>
  );
}

// ── Composant famille de groupes sanguins ────────────────────────────
function BloodFamily({
  family,
  groups,
  idealStock,
  lowThreshold,
}: {
  family: string;
  groups: { type: BloodGroup; count: number }[];
  idealStock: number;
  lowThreshold: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded" style={{ background: "var(--accent)" }} />
        <span className="font-semibold text-sm" style={{ color: "var(--txt)" }}>Groupe {family}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 pl-3">
        {groups.map((g) => (
          <BloodGroupCard 
            key={g.type} 
            groupe={g.type} 
            count={g.count} 
            idealStock={idealStock}
            lowThreshold={lowThreshold}
          />
        ))}
      </div>
    </div>
  );
}

// ── Synthèse de santé du stock ───────────────────────────────────────
function StockHealthSummary({
  ok,
  low,
  empty,
  total,
}: {
  ok: number;
  low: number;
  empty: number;
  total: number;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--surface-2)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
          Santé du stock
        </span>
        <span className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
          {total} poches total
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-lg py-3" style={{ background: "var(--ok-tint)" }}>
          <span className="num font-bold text-xl" style={{ color: "var(--ok)" }}>{ok}</span>
          <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--ok)" }}>OK</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg py-3" style={{ background: "var(--warn-tint)" }}>
          <span className="num font-bold text-xl" style={{ color: "var(--warn)" }}>{low}</span>
          <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--warn)" }}>Faibles</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg py-3" style={{ background: "var(--crit-tint)" }}>
          <span className="num font-bold text-xl" style={{ color: "var(--crit)" }}>{empty}</span>
          <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--crit)" }}>Rupture</span>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────
export default function MedicalDashboard() {
  const { hospitalId, nom } = useAuth();
  const navigate = useNavigate();
  const inv = useApi(() => api.inventory(), []);
  const requests = useApi(() => api.listRequests(), []);
  const config = useApi(() => api.publicConfig(), []);

  const prenom = (nom ?? "").split(" ")[0];
  const idealStock = config.data?.ideal_stock ?? 50;
  const lowThreshold = config.data?.low_stock_threshold ?? 5;

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.14em] mb-1" style={{ color: "var(--txt-mute)" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
          <h1 className="font-bold text-2xl" style={{ color: "var(--txt)", letterSpacing: "-0.015em" }}>
            {greeting},{" "}
            <span style={{ color: "var(--txt)" }}>{prenom || "Docteur"}</span>
          </h1>
          {myHospital && (
            <div className="mono text-[11px] mt-0.5" style={{ color: "var(--txt-mute)" }}>
              {myHospital.nom} · {myHospital.localisation}
            </div>
          )}
        </div>

        {criticalReqs > 0 && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2"
            style={{
              background: "var(--crit-tint)",
              border: "1px solid color-mix(in srgb, var(--crit) 30%, transparent)",
            }}
          >
            <AlertTriangle size={16} style={{ color: "var(--crit)" }} />
            <span className="mono text-[11px] font-bold" style={{ color: "var(--crit)" }}>
              {criticalReqs} demande{criticalReqs > 1 ? "s" : ""} CRITIQUE{criticalReqs > 1 ? "S" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Priorités du moment ── */}
      <div
        className="rounded-2xl border p-4 md:p-5"
        style={{
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)",
          borderColor: "var(--line)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.14em] mb-1" style={{ color: "var(--txt-mute)" }}>
              Priorités du moment
            </div>
            <div className="font-semibold text-base" style={{ color: "var(--txt)" }}>
              {criticalReqs > 0
                ? `${criticalReqs} demande${criticalReqs > 1 ? "s" : ""} critique${criticalReqs > 1 ? "s" : ""} requiert une action immédiate`
                : "Aucune urgence critique en cours"}
            </div>
            <div className="mt-1 text-sm" style={{ color: "var(--txt-dim)" }}>
              {groupsAlerts.length > 0
                ? `Rupture de stock sur ${groupsAlerts.join(", ")}`
                : "Le stock est globalement stable pour les groupes principaux"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ background: "var(--warn-tint)", color: "var(--warn)" }}
            >
              Urgence · {criticalReqs}
            </span>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ background: "var(--crit-tint)", color: "var(--crit)" }}
            >
              Rupture · {groupsAlerts.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          icon={Droplet}
          label="Poches disponibles"
          value={totalDispo}
          sub="hôpital"
          tone={totalDispo === 0 ? "crit" : totalDispo <= lowThreshold * 2 ? "warn" : "ok"}
          pulse={totalDispo <= lowThreshold}
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

        {/* ── Stock par groupe sanguin (layout amélioré) ── */}
        <Card
          title="Stock · Hôpital"
          subtitle="Poches disponibles par groupe"
          className="lg:col-span-1 lg:self-start"
          action={
            groupsAlerts.length > 0 ? (
              <span
                className="mono text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider font-bold"
                style={{ color: "var(--crit)", background: "var(--crit-tint)" }}
              >
                {groupsAlerts.length} rupture{groupsAlerts.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span
                className="mono text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider font-bold"
                style={{ color: "var(--ok)", background: "var(--ok-tint)" }}
              >
                Nominal
              </span>
            )
          }
        >
          {inv.loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[80px] rounded-xl" />
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-[20px] w-16 rounded-md" />
                    <div className="grid grid-cols-2 gap-2 pl-3">
                      <Skeleton className="h-[90px] rounded-xl" />
                      <Skeleton className="h-[90px] rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Synthèse de santé du stock (en haut maintenant) */}
              <StockHealthSummary
                ok={BLOOD_GROUPS.filter(g => stockByGroup[g] > lowThreshold).length}
                low={BLOOD_GROUPS.filter(g => stockByGroup[g] > 0 && stockByGroup[g] <= lowThreshold).length}
                empty={BLOOD_GROUPS.filter(g => stockByGroup[g] === 0).length}
                total={totalDispo}
              />

              {/* Groupes par famille */}
              <div className="space-y-3">
                <BloodFamily
                  family="A"
                  idealStock={idealStock}
                  lowThreshold={lowThreshold}
                  groups={[
                    { type: "A+" as BloodGroup, count: stockByGroup["A+" as BloodGroup] },
                    { type: "A-" as BloodGroup, count: stockByGroup["A-" as BloodGroup] },
                  ]}
                />
                <BloodFamily
                  family="B"
                  idealStock={idealStock}
                  lowThreshold={lowThreshold}
                  groups={[
                    { type: "B+" as BloodGroup, count: stockByGroup["B+" as BloodGroup] },
                    { type: "B-" as BloodGroup, count: stockByGroup["B-" as BloodGroup] },
                  ]}
                />
                <BloodFamily
                  family="AB"
                  idealStock={idealStock}
                  lowThreshold={lowThreshold}
                  groups={[
                    { type: "AB+" as BloodGroup, count: stockByGroup["AB+" as BloodGroup] },
                    { type: "AB-" as BloodGroup, count: stockByGroup["AB-" as BloodGroup] },
                  ]}
                />
                <BloodFamily
                  family="O"
                  idealStock={idealStock}
                  lowThreshold={lowThreshold}
                  groups={[
                    { type: "O+" as BloodGroup, count: stockByGroup["O+" as BloodGroup] },
                    { type: "O-" as BloodGroup, count: stockByGroup["O-" as BloodGroup] },
                  ]}
                />
              </div>
            </div>
          )}
        </Card>

        {/* ── Colonne droite : demandes + actions rapides ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Actions rapides (déplacées en haut pour plus de visibilité) ── */}
          <Card title="Actions prioritaires" subtitle="Accès direct aux tâches courantes">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button onClick={() => navigate("/medical/register")} variant="blood" className="justify-center py-3">
                <Droplet size={18} className="mr-2" />
                <span className="text-sm font-medium">Nouvelle poche</span>
              </Button>
              <Button onClick={() => navigate("/medical/validity")} variant="outline" className="justify-center py-3">
                <ShieldCheck size={18} className="mr-2" />
                <span className="text-sm font-medium">Vérifier UID</span>
              </Button>
              <Button onClick={() => navigate("/medical/request")} variant="secondary" className="justify-center py-3">
                <Syringe size={18} className="mr-2" />
                <span className="text-sm font-medium">Demande sang</span>
              </Button>
            </div>
          </Card>

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
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      {isCrit && (
                        <AlertTriangle size={14} className="shrink-0" style={{ color: "var(--crit)" }} />
                      )}
                      <GroupBadge groupe={r.groupe_sanguin} />
                      <span className="font-bold text-sm" style={{ color: "var(--txt)" }}>
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

        </div>
      </div>

      <div className="flex items-center gap-4 py-2">
        <span className="status-dot" style={{ background: "var(--ok)" }} />
        <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
          Données actualisées · {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
