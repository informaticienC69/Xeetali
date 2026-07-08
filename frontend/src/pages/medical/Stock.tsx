// Stock.tsx — Refonte UX "Workspace" : Sidebar de filtres + Grille de cartes "Digital Twin"
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Droplet,
  Filter,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup, type Pouch, type PouchStatus } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, ConfirmModal, EmptyState, PageHeader, Select, Skeleton } from "../../components/ui";

const STATUSES: PouchStatus[] = ["DISPONIBLE", "RESERVEE", "UTILISEE", "PERIMEE"];

const STATUS_LABELS: Record<PouchStatus, string> = {
  DISPONIBLE: "Disponible",
  RESERVEE: "Réservée",
  UTILISEE: "Utilisée",
  PERIMEE: "Périmée",
};

const STATUS_COLORS: Record<PouchStatus, { color: string; bg: string; border: string }> = {
  DISPONIBLE: { color: "var(--ok)",    bg: "rgba(22,163,74,0.12)",   border: "rgba(22,163,74,0.30)"   },
  RESERVEE:   { color: "var(--warn)",  bg: "rgba(217,119,6,0.12)",   border: "rgba(217,119,6,0.30)"   },
  UTILISEE:   { color: "#8b5cf6",      bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.30)"  },
  PERIMEE:    { color: "var(--blood)", bg: "rgba(230,57,70,0.12)",   border: "rgba(230,57,70,0.30)"   },
};

// Calcul temps restant
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── Carte "Digital Twin" d'une poche de sang ─────────────────────────
function PouchCard({
  p,
  hospitalName,
  onChangeStatus,
}: {
  p: Pouch;
  hospitalName: string;
  onChangeStatus: (current: PouchStatus, target: PouchStatus) => void;
}) {
  const isNeg = p.groupe_sanguin.includes("-");
  const c = STATUS_COLORS[p.statut];
  const dLeft = daysUntil(p.date_peremption);
  const expiryTone = dLeft < 14 ? "var(--blood)" : dLeft < 30 ? "var(--warn)" : "var(--txt-mute)";

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = c.color + "80";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${c.color}25, 0 0 0 1px ${c.color}40`;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Accent supérieur coloré selon le statut */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c.color }} />

      <div className="p-4 flex-1 flex flex-col relative z-10">
        {/* Entête : Statut + UID */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
            <span className="syne font-bold text-[10px] uppercase tracking-wider" style={{ color: c.color }}>
              {STATUS_LABELS[p.statut]}
            </span>
          </div>
          <span className="mono text-[10px] uppercase tracking-wider truncate max-w-[130px]" style={{ color: "var(--txt-mute)" }}>
            {p.uid}
          </span>
        </div>

        {/* Cœur : Groupe Sanguin Géant */}
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="relative">
            <Droplet size={64} style={{ color: "rgba(230,57,70,0.05)", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(2.5)" }} />
            <div className="flex flex-col items-center justify-center relative z-10">
              <span className="mono text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--txt-mute)", opacity: 0.7 }}>
                {isNeg ? "RH−" : "RH+"}
              </span>
              <span className="syne font-black text-5xl leading-none" style={{ color: "var(--txt)", textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
                {p.groupe_sanguin.replace(/[+-]/, "")}
              </span>
            </div>
          </div>
        </div>

        {/* Détails : Hôpital & Péremption */}
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center gap-2 mono text-[11px]" style={{ color: "var(--txt-dim)" }}>
            <MapPin size={12} style={{ color: "var(--txt-mute)" }} />
            <span className="truncate">{hospitalName}</span>
          </div>
          <div className="flex items-center gap-2 mono text-[11px]">
            <CalendarDays size={12} style={{ color: expiryTone }} />
            <span style={{ color: expiryTone }}>{p.date_peremption} ({dLeft}j)</span>
          </div>
        </div>
      </div>

      {/* Actions (Révélées au survol ou toujours visibles mais discrètes) */}
      <div className="p-3 bg-(--surface-2) border-t border-(--line) flex gap-1.5 overflow-x-auto no-scrollbar">
        {STATUSES.filter((s) => s !== p.statut).map((s) => {
          const sc = STATUS_COLORS[s];
          return (
            <button
              key={s}
              onClick={() => onChangeStatus(p.statut, s)}
              className="flex-1 min-w-max shrink-0 mono text-[9px] px-2 py-1.5 rounded-lg border uppercase font-medium transition-all cursor-pointer"
              style={{
                color: sc.color,
                background: "transparent",
                borderColor: `${sc.color}40`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = sc.bg;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              → {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sidebar de Filtres ──────────────────────────────────────────────
function SidebarFilterItem({
  active,
  onClick,
  label,
  count,
  color = "var(--txt)",
}: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  count?: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-left"
      style={{
        background: active ? `${color}15` : "transparent",
        border: `1px solid ${active ? `${color}40` : "transparent"}`,
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span className="syne font-semibold text-sm" style={{ color: active ? color : "var(--txt-dim)" }}>
        {label}
      </span>
      {count !== undefined && (
        <span
          className="mono text-[10px] px-2 py-0.5 rounded-md"
          style={{
            background: active ? `${color}30` : "var(--surface-3)",
            color: active ? color : "var(--txt-mute)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function Stock() {
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);

  // Filtres
  const [groupe, setGroupe] = useState<BloodGroup | "">("");
  const [hospital, setHospital] = useState<number | "">("");
  const [statut, setStatut] = useState<PouchStatus | "">("DISPONIBLE");
  const [uidQuery, setUidQuery] = useState("");

  // Résultats
  const [results, setResults] = useState<Pouch[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Affichage (Pagination & Taille)
  const [displayCount, setDisplayCount] = useState(6);
  const [gridSize, setGridSize] = useState<"compact" | "medium" | "large">("medium");

  // Modale
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    uid: string;
    currentStatut: PouchStatus;
    newStatut: PouchStatus;
  }>({ open: false, uid: "", currentStatut: "DISPONIBLE", newStatut: "DISPONIBLE" });

  // Auto-recherche
  const search = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.searchPouches({
        groupe_sanguin: groupe || undefined,
        hospital_id: hospital === "" ? undefined : hospital,
        statut: statut || undefined,
      });
      setResults(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [groupe, hospital, statut, toast]);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupe, hospital, statut]);

  // Filtrage UID en local
  const shown = useMemo(() => {
    const term = uidQuery.trim();
    return (results ?? []).filter((p) => !term || p.uid.toUpperCase().includes(term));
  }, [results, uidQuery]);

  // Reset pagination quand les filtres changent
  useEffect(() => {
    setDisplayCount(6);
  }, [groupe, hospital, statut, uidQuery]);

  // Stats locales (pour le statut actif ou global)
  const stats = useMemo(() => {
    if (!results) return {};
    const byStatus: Record<string, number> = {};
    results.forEach((p) => { byStatus[p.statut] = (byStatus[p.statut] ?? 0) + 1; });
    return byStatus;
  }, [results]);

  function requestStatusChange(uid: string, currentStatut: PouchStatus, newStatut: PouchStatus) {
    if (currentStatut === newStatut) return;
    setConfirmState({ open: true, uid, currentStatut, newStatut });
  }

  async function confirmStatusChange() {
    const { uid, newStatut } = confirmState;
    setConfirmState((s) => ({ ...s, open: false }));
    try {
      await api.updatePouchStatus(uid, newStatut);
      toast.success(`Poche ${uid} → ${STATUS_LABELS[newStatut]}`);
      search();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    }
  }

  const hospMap = useMemo(() => {
    const m = new Map<number, string>();
    inv.data?.forEach(h => m.set(h.hospital_id, h.nom));
    return m;
  }, [inv.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock & Urgence"
        subtitle="Inventaire temps réel"
        icon={Activity}
      />

      {/* Barre d'outils haut : Recherche & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-2 rounded-2xl" style={{ background: "transparent" }}>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--txt-mute)" }} />
          <input
            type="text"
            value={uidQuery}
            onChange={(e) => setUidQuery(e.target.value.toUpperCase())}
            placeholder="Rechercher par UID (ex: XEE-123...)"
            className="w-full mono text-[13px] rounded-xl pl-11 pr-4 py-3 transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--txt)",
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--blood)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(230,57,70,0.15)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          {/* Toggle Taille */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
            {(["compact", "medium", "large"] as const).map(s => (
              <button
                key={s}
                onClick={() => setGridSize(s)}
                className="px-3 py-1 rounded-md mono text-[10px] uppercase font-bold transition-all cursor-pointer"
                style={{
                  background: gridSize === s ? "var(--surface)" : "transparent",
                  color: gridSize === s ? "var(--txt)" : "var(--txt-mute)",
                  boxShadow: gridSize === s ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                }}
                title={`Taille: ${s}`}
              >
                {s === "compact" ? "S" : s === "medium" ? "M" : "L"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="mono text-[11px]" style={{ color: "var(--txt-mute)" }}>
              {shown.length} résultat{shown.length > 1 ? "s" : ""}
            </span>
            <Button variant="secondary" onClick={search} loading={loading}>
              <RefreshCw size={14} /> Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── SIDEBAR FILTRES ── */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
          <div className="p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2 mb-6">
              <Filter size={18} style={{ color: "var(--txt-dim)" }} />
              <h3 className="syne font-bold text-lg" style={{ color: "var(--txt)" }}>Filtres</h3>
            </div>

            {/* Statut */}
            <div className="mb-8">
              <div className="mono text-[11px] uppercase tracking-wider mb-3" style={{ color: "var(--txt-mute)" }}>Statut</div>
              <div className="space-y-1.5">
                <SidebarFilterItem
                  active={statut === ""}
                  onClick={() => setStatut("")}
                  label="Tous les statuts"
                  color="var(--txt)"
                />
                {STATUSES.map(s => (
                  <SidebarFilterItem
                    key={s}
                    active={statut === s}
                    onClick={() => setStatut(s)}
                    label={STATUS_LABELS[s]}
                    color={STATUS_COLORS[s].color}
                    count={statut === "" || statut === s ? stats[s] : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Groupe Sanguin */}
            <div className="mb-8">
              <div className="mono text-[11px] uppercase tracking-wider mb-3 flex justify-between items-center" style={{ color: "var(--txt-mute)" }}>
                <span>Groupe Sanguin</span>
                {groupe && (
                  <button onClick={() => setGroupe("")} className="hover:text-(--blood) transition-colors">Réinitialiser</button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(g => (
                  <button
                    key={g}
                    onClick={() => setGroupe(groupe === g ? "" : g)}
                    className="syne font-bold text-base py-2.5 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: groupe === g ? "rgba(230,57,70,0.15)" : "var(--surface-2)",
                      border: `1px solid ${groupe === g ? "rgba(230,57,70,0.4)" : "var(--line)"}`,
                      color: groupe === g ? "var(--blood)" : "var(--txt-dim)",
                    }}
                    onMouseEnter={(e) => {
                      if (groupe !== g) (e.currentTarget as HTMLElement).style.background = "var(--surface-3)";
                    }}
                    onMouseLeave={(e) => {
                      if (groupe !== g) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                    }}
                  >
                    {g.replace(/[+-]/, "")}<span className="text-[10px] opacity-70 ml-0.5">{g.includes("-") ? "−" : "+"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hôpital */}
            <div>
              <div className="mono text-[11px] uppercase tracking-wider mb-3" style={{ color: "var(--txt-mute)" }}>Hôpital</div>
              <Select
                value={hospital}
                onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full"
              >
                <option value="">Réseau complet (Tous)</option>
                {inv.data?.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* ── ZONE PRINCIPALE (Workspace) ── */}
        <div className="grow w-full min-w-0 flex flex-col gap-4">

          {/* Grille de Résultats */}
          {loading ? (
            <div className={
              gridSize === "large"   ? "grid grid-cols-1 lg:grid-cols-2 gap-6" :
              gridSize === "compact" ? "grid grid-cols-2 md:grid-cols-3 gap-3" :
              "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            }>
              {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          ) : !results || results.length === 0 ? (
            <div className="pt-12">
              <EmptyState message={
                groupe || statut !== "DISPONIBLE" || hospital
                  ? "Aucune poche ne correspond à vos critères."
                  : "Aucune poche disponible dans l'ensemble du réseau."
              } />
            </div>
          ) : shown.length === 0 ? (
            <div className="pt-12">
              <EmptyState message={`Aucun UID ne contient "${uidQuery}".`} />
            </div>
          ) : (
            <>
              <div className={
                gridSize === "large"   ? "grid grid-cols-1 lg:grid-cols-2 gap-6" :
                gridSize === "compact" ? "grid grid-cols-2 md:grid-cols-3 gap-3" :
                "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              }>
                {shown.slice(0, displayCount).map(p => (
                  <PouchCard
                    key={p.id}
                    p={p}
                    hospitalName={hospMap.get(p.hospital_id) || `Hôpital #${p.hospital_id}`}
                    onChangeStatus={(cur, nxt) => requestStatusChange(p.uid, cur, nxt)}
                  />
                ))}
              </div>
              
              {/* Pagination / Voir plus */}
              {shown.length > displayCount && (
                <div className="pt-6 pb-2 flex justify-center">
                  <button
                    onClick={() => setDisplayCount(c => c + 6)}
                    className="mono text-[11px] uppercase font-bold px-6 py-2.5 rounded-full transition-all cursor-pointer"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--txt-dim)",
                      border: "1px solid var(--line)"
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--txt)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--txt-mute)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--txt-dim)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                    }}
                  >
                    Charger plus de poches ({shown.length - displayCount} restants)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmState.open}
        title="Changer le statut ?"
        description={`${confirmState.uid} · ${STATUS_LABELS[confirmState.currentStatut]} → ${STATUS_LABELS[confirmState.newStatut]}. Cette action est irréversible.`}
        confirmLabel={`→ ${STATUS_LABELS[confirmState.newStatut]}`}
        tone={confirmState.newStatut === "PERIMEE" || confirmState.newStatut === "UTILISEE" ? "warn" : "ok"}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
