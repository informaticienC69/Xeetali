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
      className="relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: isCrit ? "rgba(230,57,70,0.05)" : "var(--surface-2)",
        border: `1px solid ${isCrit ? "rgba(230,57,70,0.25)" : "var(--line)"}`,
        boxShadow: isCrit ? "inset 3px 0 0 var(--blood)" : isUrg ? "inset 3px 0 0 var(--warn)" : "none",
      }}
    >
      {/* Indicateur urgence (point animé pour critique) */}
      <div className="relative shrink-0">
        <GroupBadge groupe={r.groupe_sanguin} />
        {isCrit && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-(--blood) pulse-soft" />
        )}
      </div>

      {/* Quantité */}
      <div className="flex flex-col shrink-0 min-w-[32px]">
        <span className="syne font-black text-lg leading-none" style={{ color: isCrit ? "var(--blood)" : isUrg ? "var(--warn)" : "var(--txt)" }}>
          {r.quantite}
        </span>
        <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
          poche{r.quantite > 1 ? "s" : ""}
        </span>
      </div>

      {/* Urgence */}
      <div className="flex-1 min-w-0">
        <UrgencyBadge urgence={r.urgence} />
      </div>

      {/* Statut */}
      <div
        className="mono text-[10px] font-bold uppercase px-2 py-1 rounded-lg shrink-0"
        style={{ background: stat.bg, color: stat.color }}
      >
        {stat.label}
      </div>

      {/* Heure */}
      <div className="flex flex-col items-end shrink-0">
        <span className="mono text-[11px] font-semibold" style={{ color: "var(--txt-dim)" }}>{time}</span>
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
        subtitle="Gestion des urgences"
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
      <div className="flex flex-col xl:flex-row gap-6 items-stretch flex-1 min-h-0">

        {/* ══ COLONNE GAUCHE : FORMULAIRE ══ */}
        <div className="w-full xl:w-[45%] shrink-0 flex flex-col">
          <form
            onSubmit={submit}
            className="h-full flex flex-col justify-between gap-4 p-5 rounded-3xl"
            style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
          >
            {/* En-tête form */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="syne font-bold text-xl" style={{ color: "var(--txt)" }}>Nouvelle demande</h2>
                <p className="mono text-[10px] uppercase tracking-wider mt-1" style={{ color: "var(--txt-mute)" }}>
                  Tous les champs sont obligatoires
                </p>
              </div>
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(230,57,70,0.1)" }}
              >
                <Droplets size={16} style={{ color: "var(--blood)" }} />
              </div>
            </div>

            {/* ─ ÉTAPE 1 : Hôpital ─ */}
            <div>
              <label className="block mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--txt-mute)" }}>
                1. Hôpital demandeur
              </label>
              <Select
                value={hospital}
                onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full"
              >
                <option value="" disabled>— Choisir l'hôpital —</option>
                {inv.data?.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
                ))}
              </Select>
            </div>

            {/* ─ ÉTAPE 2 : Groupe sanguin ─ */}
            <div>
              <label className="block mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--txt-mute)" }}>
                2. Groupe sanguin requis
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {BLOOD_GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroupe(g)}
                    className="relative syne font-bold text-sm py-2 rounded-xl transition-all duration-200 overflow-hidden"
                    style={{
                      background: groupe === g ? "var(--blood)" : "var(--surface-2)",
                      color: groupe === g ? "#fff" : "var(--txt-dim)",
                      border: `1px solid ${groupe === g ? "var(--blood)" : "var(--line)"}`,
                      boxShadow: groupe === g ? "0 6px 18px rgba(230,57,70,0.28)" : "none",
                      transform: groupe === g ? "translateY(-1px)" : "none",
                    }}
                  >
                    {groupe === g && (
                      <div className="absolute inset-0 bg-white opacity-15" style={{ clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 100%)" }} />
                    )}
                    <span className="relative z-10">
                      {g.replace(/[+-]/, "")}
                      <span className="text-xs opacity-80 ml-0.5">{g.includes("-") ? "−" : "+"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─ ÉTAPE 3 : Quantité ─ */}
            <div>
              <label className="block mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--txt-mute)" }}>
                3. Quantité de poches
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantite(Math.max(1, quantite - 1))}
                  className="h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer hover:scale-110"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--txt-dim)" }}
                >
                  <Minus size={16} />
                </button>
                <div
                  className="flex-1 text-center syne font-black text-2xl rounded-xl py-1.5"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--blood)" }}
                >
                  {quantite}
                  <span className="syne font-normal text-sm ml-2" style={{ color: "var(--txt-mute)" }}>
                    poche{quantite > 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantite(quantite + 1)}
                  className="h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer hover:scale-110"
                  style={{ background: "var(--blood)", border: "1px solid var(--blood)", color: "#fff", boxShadow: "0 4px 12px rgba(230,57,70,0.3)" }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* ─ ÉTAPE 4 : Niveau d'urgence ─ */}
            <div>
              <label className="block mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--txt-mute)" }}>
                4. Niveau d'urgence
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {URGENCY_CONFIG.map((u) => {
                  const isSelected = urgence === u.value;
                  return (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setUrgence(u.value)}
                      className="relative flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all duration-200 overflow-hidden cursor-pointer"
                      style={{
                        background: isSelected ? u.bgActive : "var(--surface-2)",
                        border: `2px solid ${isSelected ? u.borderActive : "var(--line)"}`,
                        transform: isSelected ? "translateY(-1px)" : "none",
                        boxShadow: isSelected ? `0 6px 18px ${u.colorActive}25` : "none",
                      }}
                    >
                      {u.value === "CRITIQUE" && isSelected && (
                        <span className="absolute inset-0 pointer-events-none pulse-soft" style={{ background: "radial-gradient(circle at center, rgba(230,57,70,0.12) 0%, transparent 70%)" }} />
                      )}
                      <span className="syne font-bold text-sm" style={{ color: isSelected ? u.colorActive : "var(--txt-dim)" }}>
                        {u.label}
                      </span>
                      <span className="mono text-[9px] text-center uppercase tracking-wider" style={{ color: isSelected ? u.colorActive : "var(--txt-mute)", opacity: 0.85 }}>
                        {u.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Avertissement CRITIQUE */}
            {urgence === "CRITIQUE" && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.3)", boxShadow: "inset 4px 0 0 var(--blood)" }}
              >
                <AlertTriangle size={15} className="pulse-soft shrink-0" style={{ color: "var(--blood)" }} />
                <p className="mono text-[11px]" style={{ color: "var(--blood)" }}>
                  Alerte immédiate déclenchée sur tout le réseau hospitalier.
                </p>
              </div>
            )}

            {/* Protocole de compatibilité */}
            <div className="flex-1 min-h-0 flex flex-col justify-end">
              <div 
                className="p-4 rounded-xl flex items-start gap-3"
                style={{ background: "color-mix(in srgb, var(--surface-2) 50%, transparent)", border: "1px dashed var(--line)" }}
              >
                <div className="mt-0.5"><Activity size={14} style={{ color: "var(--txt-mute)" }} /></div>
                <div>
                  <h4 className="syne font-bold text-xs mb-1" style={{ color: "var(--txt)" }}>Protocole de transfusion</h4>
                  <p className="mono text-[10px]" style={{ color: "var(--txt-dim)" }}>
                    Si le groupe <strong style={{ color: "var(--blood)" }}>{groupe}</strong> est en rupture, vous pouvez accepter des poches des groupes suivants : <span className="font-bold">{COMPATIBILITY[groupe]}</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Récap + Bouton */}
            <div className="mt-auto flex flex-col gap-2">
              {/* Récap visuel */}
              {hospital !== "" && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl mono text-xs"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
                >
                  <span style={{ color: "var(--txt-mute)" }}>Résumé :</span>
                  <span style={{ color: "var(--txt)" }}>{quantite} poche(s)</span>
                  <span className="syne font-bold" style={{ color: "var(--blood)" }}>{groupe}</span>
                  <span
                    className="ml-auto px-2 py-0.5 rounded-md font-bold uppercase text-[10px]"
                    style={{ background: selectedUrgency.bgActive, color: selectedUrgency.colorActive }}
                  >
                    {selectedUrgency.label}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                loading={saving}
                disabled={hospital === ""}
                className="w-full py-2.5 rounded-xl font-bold tracking-wide"
              >
                <Syringe size={16} />
                Émettre la demande
              </Button>
            </div>
          </form>
        </div>

        {/* ══ COLONNE DROITE : ACTIVITÉ EN TEMPS RÉEL ══ */}
        <div className="grow w-full flex flex-col gap-4 min-h-0">
          {/* En-tête de la colonne */}
          <div
            className="p-5 rounded-3xl flex flex-col gap-4"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            {/* Titre + Compteurs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} style={{ color: "var(--blood)" }} />
                <span className="syne font-bold text-base" style={{ color: "var(--txt)" }}>Activité en cours</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="mono text-[10px] px-2.5 py-1 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--txt-mute)" }}>
                  {openCount} ouverte{openCount > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* ─ Filtres (Select premium) ─ */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={fGroupe}
                onChange={(e) => setFGroupe(e.target.value)}
                className="w-40"
              >
                <option value="">Tous groupes</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>

              <Select
                value={fUrgence}
                onChange={(e) => setFUrgence(e.target.value)}
                className="w-44"
              >
                <option value="">Toutes urgences</option>
                {URGENCES.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>

              <Select
                value={fStatut}
                onChange={(e) => setFStatut(e.target.value)}
                className="w-40"
              >
                <option value="">Tous statuts</option>
                {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>

              {(fGroupe || fUrgence || fStatut) && (
                <button
                  type="button"
                  onClick={() => { setFGroupe(""); setFUrgence(""); setFStatut(""); }}
                  className="mono text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer hover:opacity-80"
                  style={{ background: "rgba(230,57,70,0.08)", color: "var(--blood)", border: "1px solid rgba(230,57,70,0.2)" }}
                >× Réinitialiser</button>
              )}

              <div className="ml-auto flex items-center gap-1.5 mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
                <Clock size={11} />
                {requests.data ? `${filtered.length} / ${requests.data.length} demandes` : "…"}
              </div>
            </div>
          </div>

          {/* ─ Liste des demandes ─ */}
          <div
            className="flex-1 p-4 rounded-3xl flex flex-col gap-2 overflow-y-auto min-h-0"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            {requests.loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : !filtered.length ? (
              <EmptyState message="Aucune demande ne correspond aux filtres sélectionnés." />
            ) : (
              filtered.map((r) => <RequestCard key={r.id} r={r} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
