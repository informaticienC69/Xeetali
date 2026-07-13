// Request.tsx — Refonte UX Premium "Command Center"
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock, Droplets, Minus, Plus, Syringe } from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup, type BloodRequest } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { Button, GroupBadge, PageHeader, Select, Skeleton, UrgencyBadge, EmptyState } from "../../components/ui";

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

const URGENCY_CONFIG = [
  {
    value: "NORMALE",
    label: "Normale",
    sub: "Délai standard",
    color: "var(--txt-mute)",
    bg: "var(--surface-2)",
    bgActive: "rgba(34,197,94,0.12)",
    borderActive: "rgba(34,197,94,0.5)",
    colorActive: "#22c55e",
  },
  {
    value: "URGENTE",
    label: "Urgente",
    sub: "Sous 24 heures",
    color: "var(--warn)",
    bg: "var(--surface-2)",
    bgActive: "rgba(217,119,6,0.12)",
    borderActive: "rgba(217,119,6,0.55)",
    colorActive: "var(--warn)",
  },
  {
    value: "CRITIQUE",
    label: "Critique",
    sub: "Intervention immédiate",
    color: "var(--blood)",
    bg: "var(--surface-2)",
    bgActive: "rgba(230,57,70,0.12)",
    borderActive: "rgba(230,57,70,0.55)",
    colorActive: "var(--blood)",
  },
] as const;

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OUVERTE:    { label: "Ouverte",    color: "var(--warn)",  bg: "rgba(217,119,6,0.1)"    },
  SATISFAITE: { label: "Satisfaite", color: "var(--ok)",   bg: "rgba(34,197,94,0.1)"    },
  ANNULEE:    { label: "Annulée",    color: "var(--txt-mute)", bg: "rgba(100,100,120,0.1)" },
};

function RequestCard({ r }: { r: BloodRequest }) {
  const isCrit = r.urgence === "CRITIQUE";
  const isUrg  = r.urgence === "URGENTE";
  const stat = STATUT_CONFIG[r.statut] ?? STATUT_CONFIG.OUVERTE;
  const time = new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  return (
    <div
      className="relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors duration-200"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        overflow: "hidden"
      }}
    >
      {/* Liseré de couleur pour l'urgence */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1" 
        style={{ background: isCrit ? "var(--blood)" : isUrg ? "var(--warn)" : "var(--ok)" }} 
      />

      {/* Groupe Sanguin */}
      <div className="relative shrink-0 ml-1">
        <GroupBadge groupe={r.groupe_sanguin} />
        {isCrit && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-(--blood) pulse-soft" />
        )}
      </div>

      {/* Quantité */}
      <div className="flex flex-col shrink-0 min-w-[32px] items-center justify-center">
        <span className="syne font-black text-xl leading-none" style={{ color: "var(--txt)" }}>
          {r.quantite}
        </span>
        <span className="mono text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "var(--txt-mute)" }}>
          {r.quantite > 1 ? "poches" : "poche"}
        </span>
      </div>

      {/* Urgence */}
      <div className="flex-1 min-w-0">
        <UrgencyBadge urgence={r.urgence} />
      </div>

      {/* Statut */}
      <div
        className="mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0"
        style={{ background: stat.bg, color: stat.color }}
      >
        {stat.label}
      </div>

      {/* Heure / Date */}
      <div className="flex flex-col items-end shrink-0 min-w-[50px]">
        <span className="mono text-[12px] font-bold" style={{ color: "var(--txt-dim)" }}>{time}</span>
        <span className="mono text-[9px]" style={{ color: "var(--txt-mute)" }}>{date}</span>
      </div>
    </div>
  );
}

export default function Request() {
  const { hospitalId } = useAuth();
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);
  const requests = useApi(() => api.listRequests(), []);

  const [hospital, setHospital] = useState<number | "">(hospitalId ?? "");
  const [groupe, setGroupe] = useState<BloodGroup>("O-");
  const [quantite, setQuantite] = useState(1);
  const [urgence, setUrgence] = useState<string>("URGENTE");
  const [saving, setSaving] = useState(false);
  const [fGroupe, setFGroupe] = useState("");
  const [fUrgence, setFUrgence] = useState("");
  const [fStatut, setFStatut] = useState("");

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
      // On peut réinitialiser le form ici si on veut, mais souvent c'est mieux de garder le dernier pour des demandes répétées
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  const selectedUrgency = URGENCY_CONFIG.find((u) => u.value === urgence)!;

  return (
    <div className="flex flex-col h-full space-y-6">
      <PageHeader
        title="Demandes de sang"
        subtitle="Gestion des urgences et des stocks"
        icon={Syringe}
        action={
          critCount > 0 ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 pulse-blood"
              style={{ background: "rgba(230,57,70,0.10)", border: "1px solid rgba(230,57,70,0.40)" }}
            >
              <AlertTriangle size={13} className="pulse-soft" style={{ color: "var(--blood)" }} />
              <span className="mono text-[11px] font-bold" style={{ color: "var(--blood)" }}>
                {critCount} CRITIQUE{critCount > 1 ? "S" : ""}
              </span>
            </div>
          ) : undefined
        }
      />

      {/* ── LAYOUT PRINCIPAL ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start flex-1 min-h-0">

        {/* ══ COLONNE GAUCHE : FORMULAIRE ══ */}
        <div className="w-full xl:w-[45%] shrink-0 flex flex-col xl:sticky xl:top-2 h-max z-10">
          <form
            onSubmit={submit}
            className="flex flex-col gap-6 p-6 rounded-3xl relative overflow-hidden"
            style={{ 
              background: "var(--surface)", 
              border: "1px solid var(--line)", 
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)" 
            }}
          >
            {/* Effet lumineux subtil en fond */}
            <div 
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
              style={{ background: "var(--blood)", transform: "translate(30%, -30%)" }}
            />

            {/* En-tête form */}
            <div className="flex items-center gap-4 relative z-10">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.2)" }}
              >
                <Droplets size={20} style={{ color: "var(--blood)" }} />
              </div>
              <div>
                <h2 className="syne font-bold text-xl" style={{ color: "var(--txt)" }}>Nouvelle demande</h2>
                <p className="mono text-[11px] uppercase tracking-wider mt-1" style={{ color: "var(--txt-mute)" }}>
                  Renseignez les critères de la demande
                </p>
              </div>
            </div>

            <div className="space-y-5 relative z-10 flex-1">
              {/* ─ Hôpital ─ */}
              <div className="space-y-2">
                <label className="block mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
                  Hôpital demandeur
                </label>
                <Select
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full py-3 text-sm rounded-xl"
                  style={{ background: "var(--surface-2)" }}
                >
                  <option value="" disabled>Sélectionner un hôpital</option>
                  {inv.data?.map((h) => (
                    <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
                  ))}
                </Select>
              </div>

              {/* ─ Groupe sanguin ─ */}
              <div className="space-y-2">
                <label className="block mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
                  Groupe sanguin
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGroupe(g)}
                      className="relative syne font-bold text-base py-2.5 rounded-xl transition-all duration-200 overflow-hidden"
                      style={{
                        background: groupe === g ? "var(--blood)" : "var(--surface-2)",
                        color: groupe === g ? "#fff" : "var(--txt-dim)",
                        border: `1px solid ${groupe === g ? "var(--blood)" : "var(--line)"}`,
                      }}
                    >
                      <span className="relative z-10">
                        {g.replace(/[+-]/, "")}
                        <span className="text-sm opacity-90 ml-0.5">{g.includes("-") ? "−" : "+"}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {/* ─ Quantité ─ */}
                <div className="space-y-2 w-1/3">
                  <label className="block mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
                    Quantité
                  </label>
                  <div 
                    className="flex items-center rounded-xl overflow-hidden h-12"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setQuantite(Math.max(1, quantite - 1))}
                      className="h-full px-3 flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: "var(--txt-mute)" }}
                    >
                      <Minus size={16} />
                    </button>
                    <div className="flex-1 text-center syne font-bold text-lg" style={{ color: "var(--txt)" }}>
                      {quantite}
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantite(quantite + 1)}
                      className="h-full px-3 flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: "var(--txt-mute)" }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* ─ Niveau d'urgence ─ */}
                <div className="space-y-2 flex-1">
                  <label className="block mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--txt-dim)" }}>
                    Niveau d'urgence
                  </label>
                  <div className="flex bg-(--surface-2) p-1 rounded-xl border border-(--line) h-12">
                    {URGENCY_CONFIG.map((u) => {
                      const isSelected = urgence === u.value;
                      return (
                        <button
                          key={u.value}
                          type="button"
                          onClick={() => setUrgence(u.value)}
                          className="flex-1 flex flex-col items-center justify-center rounded-lg transition-all duration-200"
                          style={{
                            background: isSelected ? u.bgActive : "transparent",
                            boxShadow: isSelected ? `inset 0 0 0 1px ${u.borderActive}` : "none",
                          }}
                        >
                          <span className="syne font-bold text-[13px]" style={{ color: isSelected ? u.colorActive : "var(--txt-mute)" }}>
                            {u.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Avertissement CRITIQUE */}
              {urgence === "CRITIQUE" && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl mt-2 animate-in fade-in slide-in-from-top-2"
                  style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.2)" }}
                >
                  <AlertTriangle size={16} className="pulse-soft shrink-0" style={{ color: "var(--blood)" }} />
                  <p className="mono text-[11px]" style={{ color: "var(--blood)" }}>
                    Alerte immédiate au réseau hospitalier.
                  </p>
                </div>
              )}
            </div>

            {/* Protocole de compatibilité & Bouton */}
            <div className="mt-2 space-y-4 relative z-10">
              <div 
                className="p-4 rounded-2xl flex items-start gap-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
              >
                <div className="mt-0.5"><Activity size={16} style={{ color: "var(--txt-mute)" }} /></div>
                <div>
                  <h4 className="syne font-bold text-sm mb-1" style={{ color: "var(--txt)" }}>Protocole de transfusion</h4>
                  <p className="mono text-[11px]" style={{ color: "var(--txt-dim)" }}>
                    Si le groupe <strong style={{ color: "var(--blood)" }}>{groupe}</strong> est indisponible, accepter les groupes : <span className="font-bold">{COMPATIBILITY[groupe]}</span>.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                loading={saving}
                disabled={hospital === ""}
                className="w-full py-4 rounded-xl font-bold tracking-wide shadow-lg hover:shadow-xl hover:opacity-90 transition-all text-[13px]"
                style={{ background: "var(--blood)", color: "#fff", borderColor: "var(--blood)" }}
              >
                <Syringe size={18} className="mr-2" />
                Émettre la demande — {quantite} poche(s) {groupe}
              </Button>
            </div>
          </form>
        </div>

        {/* ══ COLONNE DROITE : ACTIVITÉ EN TEMPS RÉEL ══ */}
        <div className="grow w-full flex flex-col gap-4 min-h-0">
          <div
            className="p-4 lg:p-5 rounded-3xl flex flex-col gap-4"
            style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-(--surface-2) border border-(--line)">
                  <Activity size={18} style={{ color: "var(--txt)" }} />
                </div>
                <div>
                  <h2 className="syne font-bold text-lg" style={{ color: "var(--txt)" }}>Activité en cours</h2>
                  <div className="mono text-[10px] text-(--txt-mute) flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} />
                    {requests.data ? `${filtered.length} demandes filtrées sur ${requests.data.length}` : "Chargement..."}
                  </div>
                </div>
              </div>
              <div className="mono text-[11px] font-bold px-3 py-1.5 rounded-xl border border-(--line)" style={{ background: "var(--surface-2)", color: "var(--txt-dim)" }}>
                {openCount} OUVERTE{openCount > 1 ? "S" : ""}
              </div>
            </div>

            {/* ─ Filtres Premium ─ */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                value={fGroupe}
                onChange={(e) => setFGroupe(e.target.value)}
                className="w-[140px] text-xs py-2 rounded-lg bg-(--surface-2)"
              >
                <option value="">Tous groupes</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>

              <Select
                value={fUrgence}
                onChange={(e) => setFUrgence(e.target.value)}
                className="w-[150px] text-xs py-2 rounded-lg bg-(--surface-2)"
              >
                <option value="">Toutes urgences</option>
                {URGENCES.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>

              <Select
                value={fStatut}
                onChange={(e) => setFStatut(e.target.value)}
                className="w-[140px] text-xs py-2 rounded-lg bg-(--surface-2)"
              >
                <option value="">Tous statuts</option>
                {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>

              {(fGroupe || fUrgence || fStatut) && (
                <button
                  type="button"
                  onClick={() => { setFGroupe(""); setFUrgence(""); setFStatut(""); }}
                  className="mono text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer hover:bg-(--surface-2)"
                  style={{ color: "var(--txt-dim)", border: "1px dashed var(--line)" }}
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* ─ Liste des demandes ─ */}
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0 pr-1 pb-4">
            {requests.loading ? (
              [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[72px] rounded-2xl" />)
            ) : !filtered.length ? (
              <EmptyState message="Aucune demande ne correspond aux filtres actuels." />
            ) : (
              filtered.map((r) => <RequestCard key={r.id} r={r} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
