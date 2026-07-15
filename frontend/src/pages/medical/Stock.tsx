// Stock.tsx — Refonte UX "Data Table"
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Filter,
  RefreshCw,
  Search,
  MapPin,
} from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup, type Pouch, type PouchStatus } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, ConfirmModal, EmptyState, PageHeader, Select, Skeleton, StatusBadge, GroupBadge } from "../../components/ui";

const STATUSES: PouchStatus[] = ["DISPONIBLE", "RESERVEE", "UTILISEE", "PERIMEE"];

const STATUS_LABELS: Record<PouchStatus, string> = {
  DISPONIBLE: "Disponible",
  RESERVEE: "Réservée",
  UTILISEE: "Utilisée",
  PERIMEE: "Périmée",
};

// Calcul temps restant
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function Stock() {
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);

  // Filtres
  const [groupe, setGroupe] = useState<BloodGroup | "">("");
  const [hospital, setHospital] = useState<number | "">("");
  const [statut, setStatut] = useState<PouchStatus | "">("DISPONIBLE");
  const [uidQuery, setUidQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Résultats
  const [results, setResults] = useState<Pouch[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Modale
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    uid: string;
    currentStatut: PouchStatus;
    newStatut: PouchStatus;
  }>({ open: false, uid: "", currentStatut: "DISPONIBLE", newStatut: "DISPONIBLE" });

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

  // Reset pagination
  useEffect(() => {
    setPage(1);
  }, [groupe, hospital, statut, uidQuery]);

  const shown = useMemo(() => {
    const term = uidQuery.trim();
    return (results ?? []).filter((p) => !term || p.uid.toUpperCase().includes(term));
  }, [results, uidQuery]);

  const totalPages = Math.max(1, Math.ceil(shown.length / itemsPerPage));
  const paginatedShown = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return shown.slice(start, start + itemsPerPage);
  }, [shown, page, itemsPerPage]);

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
    <div className="space-y-6 flex flex-col h-full">
      <PageHeader
        title="Inventaire des Poches"
        subtitle="Suivi clinique du stock de sang"
        icon={Activity}
      />

      {/* Barre de filtres (Top Bar) */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 pr-3 border-r border-(--line) shrink-0">
             <Filter size={16} style={{ color: "var(--txt-mute)" }} />
             <span className="mono text-[11px] font-bold tracking-wider" style={{ color: "var(--txt-dim)" }}>FILTRES</span>
          </div>

          <Select
            value={statut}
            onChange={(e) => setStatut(e.target.value as PouchStatus | "")}
            className="w-[150px] text-xs py-2 rounded-lg bg-(--surface-2)"
          >
            <option value="">Tous les statuts</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>

          <Select
            value={groupe}
            onChange={(e) => setGroupe(e.target.value as BloodGroup | "")}
            className="w-[140px] text-xs py-2 rounded-lg bg-(--surface-2)"
          >
            <option value="">Tous groupes</option>
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>

          <Select
            value={hospital}
            onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-[180px] text-xs py-2 rounded-lg bg-(--surface-2)"
          >
            <option value="">Tous les hôpitaux</option>
            {inv.data?.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="relative w-full md:w-64">
            <label htmlFor="stock-uid-search" className="sr-only">Rechercher par UID de poche</label>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--txt-mute)" }} />
            <input
              id="stock-uid-search"
              type="search"
              value={uidQuery}
              onChange={(e) => setUidQuery(e.target.value.toUpperCase())}
              placeholder="Rechercher UID..."
              className="w-full mono text-[12px] rounded-lg pl-9 pr-3 py-2"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                color: "var(--txt)",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--txt-mute)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            />
          </div>
          
          <Button variant="secondary" onClick={search} loading={loading} className="px-3 py-2 h-auto text-xs">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* TABLEAU DE DONNÉES */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        
        {/* Entête du tableau (fixe) */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-(--line) bg-(--surface-2) font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--txt-dim)" }}>
          <div className="col-span-3">Identifiant (UID)</div>
          <div className="col-span-2">Groupe</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-3">Hôpital & Péremption</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Corps du tableau (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
             <div className="flex flex-col">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="px-6 py-4 border-b border-(--line)">
                    <Skeleton className="h-6 w-full rounded" />
                 </div>
               ))}
             </div>
          ) : !results || results.length === 0 ? (
            <div className="py-20">
              <EmptyState message="Aucune poche ne correspond aux filtres." />
            </div>
          ) : shown.length === 0 ? (
            <div className="py-20">
              <EmptyState message={`Aucune poche trouvée pour l'UID "${uidQuery}".`} />
            </div>
          ) : (
            <div className="flex flex-col">
              {paginatedShown.map((p) => {
                const hName = hospMap.get(p.hospital_id) || `Hôpital #${p.hospital_id}`;
                const dLeft = daysUntil(p.date_peremption);
                const isCrit = dLeft < 14 && p.statut === "DISPONIBLE";

                return (
                  <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-(--line) items-center hover:bg-(--surface-2) transition-colors">
                    
                    {/* UID */}
                    <div className="col-span-3">
                      <span className="mono text-[12px] font-semibold" style={{ color: "var(--txt)" }}>{p.uid}</span>
                      <div className="mono text-[9px]" style={{ color: "var(--txt-mute)" }}>Enreg: {p.date_prelevement}</div>
                    </div>

                    {/* Groupe */}
                    <div className="col-span-2">
                       <GroupBadge groupe={p.groupe_sanguin} />
                    </div>

                    {/* Statut */}
                    <div className="col-span-2">
                       <StatusBadge statut={p.statut} />
                    </div>

                    {/* Hopital & Péremption */}
                    <div className="col-span-3 flex flex-col gap-1">
                       <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--txt)" }}>
                         <MapPin size={12} style={{ color: "var(--txt-mute)" }} />
                         <span className="truncate">{hName}</span>
                       </div>
                       <div className="flex items-center gap-1.5 mono text-[10px]" style={{ color: isCrit ? "var(--blood)" : "var(--txt-dim)" }}>
                         <CalendarDays size={12} />
                         <span>{p.date_peremption} ({dLeft}j)</span>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end">
                       <div className="flex items-center gap-1">
                          {p.statut === "DISPONIBLE" && (
                            <button
                              onClick={() => requestStatusChange(p.uid, p.statut, "UTILISEE")}
                              className="px-2.5 py-1.5 rounded-lg mono text-[10px] font-bold uppercase transition-colors hover:bg-purple-500/10 hover:text-purple-500 cursor-pointer"
                              style={{ color: "var(--txt-dim)", border: "1px solid var(--line)" }}
                              title="Marquer comme utilisée"
                            >
                              Utiliser
                            </button>
                          )}
                          {p.statut === "DISPONIBLE" && (
                            <button
                              onClick={() => requestStatusChange(p.uid, p.statut, "PERIMEE")}
                              className="px-2.5 py-1.5 rounded-lg mono text-[10px] font-bold uppercase transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                              style={{ color: "var(--txt-dim)", border: "1px solid var(--line)" }}
                              title="Marquer comme périmée"
                            >
                              Périmée
                            </button>
                          )}
                          {p.statut !== "DISPONIBLE" && (
                            <span className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>Aucune action</span>
                          )}
                       </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Footer (Pagination & Total) */}
        {!loading && shown.length > 0 && (
           <div className="flex items-center justify-between px-6 py-3 border-t border-(--line) bg-(--surface-2)">
             <div className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
               Total : {shown.length} poche{shown.length > 1 ? "s" : ""}
             </div>
             
             <div className="flex items-center gap-6">
               <button
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="mono text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:text-(--txt) cursor-pointer"
                 style={{ color: "var(--txt-dim)" }}
               >
                 Précédent
               </button>
               
               <span className="mono text-[10px] font-bold" style={{ color: "var(--txt)" }}>
                 Page {page} / {totalPages}
               </span>
               
               <button
                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                 disabled={page === totalPages}
                 className="mono text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:text-(--txt) cursor-pointer"
                 style={{ color: "var(--txt-dim)" }}
               >
                 Suivant
               </button>
             </div>
           </div>
        )}
      </div>

      <ConfirmModal
        open={confirmState.open}
        title="Changer le statut ?"
        description={`${confirmState.uid} · ${STATUS_LABELS[confirmState.currentStatut]} → ${STATUS_LABELS[confirmState.newStatut]}. Cette action est irréversible.`}
        confirmLabel={`Confirmer (${STATUS_LABELS[confirmState.newStatut]})`}
        tone={confirmState.newStatut === "PERIMEE" || confirmState.newStatut === "UTILISEE" ? "warn" : "ok"}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
