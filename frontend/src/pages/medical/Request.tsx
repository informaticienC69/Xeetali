// Request.tsx — Refonte UX Premium "Command Center"
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Building, Clock, Droplets, Minus, Plus, PlusCircle, Syringe, X } from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup, type BloodRequest } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { Button, DataTable, GroupBadge, PageHeader, Select, Skeleton, UrgencyBadge, UrgencySelector, EmptyState } from "../../components/ui";

const URGENCES = ["NORMALE", "URGENTE", "CRITIQUE"] as const;
const STATUTS  = ["OUVERTE", "SATISFAITE", "ANNULEE"] as const;

const COMPATIBILITY: Record<BloodGroup, string> = {
  "A+": "A+, A-, O+, O-",
  "A-": "A-, O-",
  "B+": "B+, B-, O+, O-",
  "B-": "B-, O-",
  "AB+": "Tous (Receveur universel)",
  "AB-": "AB-, A-, B-, O-",
  "O+": "O+, O-",
  "O-": "O- (Donneur universel)",
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OUVERTE:    { label: "Ouverte",    color: "var(--warn)",  bg: "rgba(217,119,6,0.1)"    },
  SATISFAITE: { label: "Satisfaite", color: "var(--ok)",    bg: "rgba(34,197,94,0.1)"    },
  ANNULEE:    { label: "Annulée",    color: "var(--txt-mute)", bg: "rgba(100,100,120,0.1)" },
};

function RequestRow({ r, hospitalName }: { r: BloodRequest; hospitalName?: string }) {
  const isCrit = r.urgence === "CRITIQUE";
  const isUrg  = r.urgence === "URGENTE";
  const stat = STATUT_CONFIG[r.statut] ?? STATUT_CONFIG.OUVERTE;
  const time = new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  return (
    <>
      {/* Groupe sanguin (avec liseré de couleur selon l'urgence) */}
      <td className="px-4 py-3" style={{ boxShadow: `inset 4px 0 0 ${isCrit ? "var(--blood)" : isUrg ? "var(--warn)" : "var(--ok)"}` }}>
        <div className="relative inline-flex">
          <GroupBadge groupe={r.groupe_sanguin} />
          {isCrit && (
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full" style={{ background: "var(--blood)", boxShadow: "0 0 8px var(--blood)" }} />
          )}
        </div>
      </td>

      {/* Hôpital */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <Building size={13} className="shrink-0" style={{ color: "var(--txt-mute)" }} />
          <span className="truncate text-sm font-semibold" style={{ color: "var(--txt)" }}>
            {hospitalName || "Hôpital inconnu"}
          </span>
        </div>
      </td>

      {/* Quantité */}
      <td className="px-4 py-3">
        <span className="font-bold text-base" style={{ color: "var(--txt)" }}>{r.quantite}</span>
        <span className="mono text-[10px] uppercase tracking-wider ml-1.5" style={{ color: "var(--txt-mute)" }}>
          {r.quantite > 1 ? "poches" : "poche"}
        </span>
      </td>

      {/* Urgence */}
      <td className="px-4 py-3"><UrgencyBadge urgence={r.urgence} /></td>

      {/* Statut */}
      <td className="px-4 py-3">
        <span
          className="mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ background: stat.bg, color: stat.color }}
        >
          {stat.label}
        </span>
      </td>

      {/* Date / Heure */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <span className="mono text-[13px] font-bold" style={{ color: "var(--txt-dim)" }}>{time}</span>
        <span className="mono text-[10px] ml-2" style={{ color: "var(--txt-mute)" }}>{date}</span>
      </td>
    </>
  );
}

export default function Request() {
  const { hospitalId } = useAuth();
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);
  const requests = useApi(() => api.listRequests(), []);

  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form States
  const [hospital, setHospital] = useState<number | "">(hospitalId ?? "");
  const [groupe, setGroupe] = useState<BloodGroup>("O-");
  const [quantite, setQuantite] = useState(1);
  const [urgence, setUrgence] = useState<string>("URGENTE");
  const [saving, setSaving] = useState(false);

  // Filter States
  const [fGroupe, setFGroupe] = useState("");
  const [fUrgence, setFUrgence] = useState("");
  const [fStatut, setFStatut] = useState("OUVERTE"); // Défaut pertinent pour un Command Center

  // Map des hôpitaux pour résoudre l'ID en Nom dans la liste
  const hospitalMap = useMemo(() => {
    const map = new Map<number, string>();
    if (inv.data) {
      inv.data.forEach((h) => map.set(h.hospital_id, h.nom));
    }
    return map;
  }, [inv.data]);

  const filtered = useMemo(
    () =>
      (requests.data ?? []).filter(
        (r) =>
          (!fGroupe  || r.groupe_sanguin === fGroupe) &&
          (!fUrgence || r.urgence === fUrgence) &&
          (!fStatut  || r.statut === fStatut),
      ),
    [requests.data, fGroupe, fUrgence, fStatut],
  );

  const critCount = useMemo(
    () => (requests.data ?? []).filter((r) => r.statut === "OUVERTE" && r.urgence === "CRITIQUE").length,
    [requests.data],
  );

  const openCount = useMemo(
    () => (requests.data ?? []).filter((r) => r.statut === "OUVERTE").length,
    [requests.data],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hospital === "") return toast.error("Sélectionnez un hôpital.");
    setSaving(true);
    try {
      await api.createRequest({ hospital_id: hospital, groupe_sanguin: groupe, quantite, urgence });
      toast.success("Demande émise avec succès.");
      requests.reload();
      setIsFormOpen(false); // Fermeture du tiroir après succès
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <PageHeader
        title="Demandes de sang"
        subtitle="Supervision du réseau et gestion des urgences"
        icon={Syringe}
        action={
          <div className="flex items-center gap-4">
            {critCount > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2 animate-pulse"
                style={{ background: "rgba(206,51,65,0.12)", border: "1px solid rgba(206,51,65,0.5)" }}
              >
                <AlertTriangle size={15} style={{ color: "var(--blood)" }} />
                <span className="mono text-[12px] font-bold" style={{ color: "var(--blood)" }}>
                  {critCount} CRITIQUE{critCount > 1 ? "S" : ""}
                </span>
              </div>
            )}
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm"
            >
              <PlusCircle size={16} />
              Nouvelle demande
            </Button>
          </div>
        }
      />

      {/* ── SECTION PRINCIPALE : Activité du réseau OU Formulaire (mutuellement exclusifs) ── */}
      <div className="flex flex-col flex-1 min-h-0 bg-[var(--surface)] border border-[var(--line)] rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5" style={{ background: "var(--ok)" }} />

        {isFormOpen ? (
          /* ── FORMULAIRE (remplace la section Activité) ── */
          <>
            {/* En-tête du formulaire, même gabarit que l'en-tête "Activité du réseau" */}
            <div className="p-5 lg:p-6 flex items-center justify-between gap-5 border-b relative z-10" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(206,51,65,0.1)", border: "1px solid rgba(206,51,65,0.2)" }}
                >
                  <Droplets size={20} style={{ color: "var(--blood)" }} />
                </div>
                <div>
                  <h2 className="font-bold text-xl" style={{ color: "var(--txt)" }}>Nouvelle demande</h2>
                  <div className="mono text-[11px] flex items-center gap-2 mt-1" style={{ color: "var(--txt-mute)" }}>
                    Émission d'une demande de poches de sang
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X size={20} style={{ color: "var(--txt-mute)" }} />
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
              {/* ── Zone scrollable : tous les champs ── */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 lg:px-6 pt-6 pb-4">
                <div className="max-w-md mx-auto space-y-6">
                {/* ─ Hôpital ─ */}
                <div className="space-y-2.5">
                  <label className="block mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
                    Hôpital demandeur
                  </label>
                  <Select
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full h-14 rounded-2xl"
                  >
                    <option value="" disabled>Sélectionner un hôpital</option>
                    {inv.data?.map((h) => (
                      <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
                    ))}
                  </Select>
                </div>

                {/* ─ Groupe sanguin ─ */}
                <div className="space-y-2.5">
                  <label className="block mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
                    Groupe sanguin
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {BLOOD_GROUPS.map((g) => {
                      const isSelected = groupe === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGroupe(g)}
                          className="relative font-bold text-lg py-3 rounded-2xl transition-all duration-200"
                          style={{
                            background: isSelected ? "var(--blood)" : "var(--surface-2)",
                            color: isSelected ? "#fff" : "var(--txt-dim)",
                            border: `1px solid ${isSelected ? "var(--blood)" : "var(--line)"}`,
                            boxShadow: isSelected ? "0 4px 12px rgba(206,51,65,0.3)" : "none",
                          }}
                        >
                          {g.replace(/[+-]/, "")}
                          <span className="text-base opacity-90 ml-0.5">{g.includes("-") ? "−" : "+"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ Quantité & Urgence (côte à côte) ─ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <label className="block mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
                      Quantité
                    </label>
                    <div 
                      className="flex items-center rounded-2xl overflow-hidden h-14"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
                    >
                      <button
                        type="button"
                        onClick={() => setQuantite(Math.max(1, quantite - 1))}
                        aria-label="Diminuer la quantité"
                        className="tap-target h-full px-6 transition-colors hover:bg-black/5"
                        style={{ color: "var(--txt-mute)" }}
                      >
                        <Minus size={18} aria-hidden="true" />
                      </button>
                      <div className="flex-1 text-center font-bold text-xl" style={{ color: "var(--txt)" }} aria-live="polite">
                        {quantite}
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuantite(quantite + 1)}
                        aria-label="Augmenter la quantité"
                        className="tap-target h-full px-6 transition-colors hover:bg-black/5"
                        style={{ color: "var(--txt-mute)" }}
                      >
                        <Plus size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
                      Niveau d'urgence
                    </label>
                    <UrgencySelector value={urgence} onChange={setUrgence} />
                  </div>
                </div>

                {/* ─ Protocole de compatibilité ─ */}
                <div 
                  className="p-4 rounded-2xl flex items-start gap-3"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
                >
                  <div className="mt-0.5"><Activity size={16} style={{ color: "var(--txt-mute)" }} /></div>
                  <div>
                    <h4 className="font-bold text-xs mb-1" style={{ color: "var(--txt)" }}>Protocole de transfusion</h4>
                    <p className="mono text-[11px] leading-relaxed" style={{ color: "var(--txt-dim)" }}>
                      Si <strong style={{ color: "var(--blood)" }}>{groupe}</strong> indisponible, accepter : <span className="font-bold">{COMPATIBILITY[groupe]}</span>.
                    </p>
                  </div>
                </div>
                </div>
              </div>

              {/* ── Footer fixe : toujours visible, jamais besoin de scroller pour valider ── */}
              <div 
                className="shrink-0 px-5 lg:px-6 py-5 border-t"
                style={{ borderColor: "var(--line)", background: "var(--surface)" }}
              >
                <div className="max-w-md mx-auto flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsFormOpen(false)}
                    className="h-14 px-6 rounded-2xl text-base"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    disabled={saving}
                    className="flex-1 h-14 rounded-2xl text-base"
                  >
                    <Syringe size={20} className="mr-2" />
                    Émettre — {quantite} poche(s)
                  </Button>
                </div>
              </div>
            </form>
          </>
        ) : (
          /* ── ACTIVITÉ DU RÉSEAU (tableau + filtres) ── */
          <>
            {/* ─ En-tête et Filtres Rapides (Segmented Controls) ─ */}
            <div className="p-5 lg:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b relative z-10" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <Activity size={20} style={{ color: "var(--txt)" }} />
                </div>
                <div>
                  <h2 className="font-bold text-xl" style={{ color: "var(--txt)" }}>Activité du réseau</h2>
                  <div className="mono text-[11px] flex items-center gap-2 mt-1" style={{ color: "var(--txt-mute)" }}>
                    <Clock size={12} />
                    {requests.data ? `${filtered.length} résultats sur ${requests.data.length}` : "Chargement..."}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filtre Statut : Segmented Control */}
                <div className="flex items-center p-1 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  {["TOUS", ...STATUTS].map((s) => {
                    const isActive = (s === "TOUS" && !fStatut) || fStatut === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setFStatut(s === "TOUS" ? "" : s)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive ? "shadow-sm" : "opacity-60 hover:opacity-100"}`}
                        style={{
                          background: isActive ? "var(--surface)" : "transparent",
                          color: isActive ? "var(--txt)" : "var(--txt-dim)"
                        }}
                      >
                        {s === "TOUS" ? "Tous" : STATUT_CONFIG[s]?.label || s}
                      </button>
                    );
                  })}
                </div>

                {/* Filtre Urgence : Segmented Control */}
                <div className="flex items-center p-1 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  {["TOUTES", ...URGENCES].map((u) => {
                    const isActive = (u === "TOUTES" && !fUrgence) || fUrgence === u;
                    return (
                      <button
                        key={u}
                        onClick={() => setFUrgence(u === "TOUTES" ? "" : u)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive ? "shadow-sm" : "opacity-60 hover:opacity-100"}`}
                        style={{
                          background: isActive ? "var(--surface)" : "transparent",
                          color: isActive ? "var(--txt)" : "var(--txt-dim)"
                        }}
                      >
                        {u === "TOUTES" ? "Urgences" : u.charAt(0) + u.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>

                {/* Filtre Groupe : Chips compacts avec flex-wrap pour le responsive */}
                <div className="flex flex-wrap items-center gap-1.5 p-1">
                  {["TOUS", ...BLOOD_GROUPS].map((g) => {
                    const isActive = (g === "TOUS" && !fGroupe) || fGroupe === g;
                    return (
                      <button
                        key={g}
                        onClick={() => setFGroupe(g === "TOUS" ? "" : g)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all border ${
                          isActive ? "shadow-sm" : "opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                        style={{
                          background: isActive ? "var(--blood)" : "var(--surface-2)",
                          color: isActive ? "#fff" : "var(--txt-dim)",
                          borderColor: isActive ? "var(--blood)" : "var(--line)"
                        }}
                      >
                        {g === "TOUS" ? "Tous" : g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─ Tableau des demandes ─ */}
            <div className="flex-1 overflow-y-auto px-2 lg:px-3 bg-[var(--surface-2)]/30">
              {requests.loading ? (
                <div className="flex flex-col gap-2 p-3">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[52px] rounded-xl" />)}
                </div>
              ) : !filtered.length ? (
                <div className="p-6">
                  <EmptyState message="Aucune demande ne correspond aux filtres actuels." />
                </div>
              ) : (
                <DataTable
                  caption="Liste des demandes de sang"
                  columns={["Groupe", "Hôpital", "Quantité", "Urgence", "Statut", "Date"]}
                  data={filtered}
                  keyExtractor={(r) => r.id}
                  renderRow={(r) => <RequestRow r={r} hospitalName={hospitalMap.get(r.hospital_id)} />}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}