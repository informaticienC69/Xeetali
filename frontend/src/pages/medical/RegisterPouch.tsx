// RegisterPouch.tsx — Refonte UX Premium "Workspace"
import { useMemo, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Download, Droplet, Plus, Scan, Sparkles } from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup, type Pouch } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { Button, PageHeader, Select } from "../../components/ui";

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function daysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function RegisterPouch() {
  const { hospitalId } = useAuth();
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);
  
  const [groupe, setGroupe] = useState<BloodGroup>("O+");
  const [hospital, setHospital] = useState<number | "">(hospitalId ?? "");
  const [prelevement, setPrelevement] = useState(todayISO());
  const [peremption, setPeremption] = useState(todayISO(42));
  const [saving, setSaving] = useState(false);
  const [last, setLast] = useState<Pouch | null>(null);

  // Calcul temps réel de l'expiration
  const daysLeft = useMemo(() => daysUntilExpiry(peremption), [peremption]);
  const expiryTone = daysLeft < 14 ? "var(--blood)" : daysLeft < 30 ? "var(--warn)" : "var(--ok)";

  // Validation
  const dateError = useMemo(() => {
    if (!prelevement || !peremption) return null;
    if (new Date(peremption) <= new Date(prelevement)) {
      return "La date de péremption doit être postérieure au prélèvement.";
    }
    return null;
  }, [prelevement, peremption]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hospital === "") return toast.error("Sélectionnez un hôpital.");
    if (dateError) return toast.error(dateError);
    setSaving(true);
    try {
      const p = await api.registerPouch({
        groupe_sanguin: groupe,
        hospital_id: hospital,
        date_prelevement: prelevement,
        date_peremption: peremption,
      });
      setLast(p);
      toast.success(`Poche ${p.uid} enregistrée avec succès.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  function downloadQr(p: Pouch) {
    const a = document.createElement("a");
    a.href = p.qr_code_b64;
    a.download = `${p.uid}.png`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enregistrer une poche"
        subtitle="Entrée de stock sécurisée"
        icon={Plus}
      />

      <div className="flex flex-col xl:flex-row gap-8 items-stretch">
        
        {/* ── COLONNE GAUCHE : FORMULAIRE ── */}
        <div className="grow w-full xl:w-[58%] flex flex-col gap-6">
          <form onSubmit={submit} className="h-full flex flex-col p-5 rounded-3xl relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            
            {/* Decorative gradient background */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5" style={{ background: "var(--blood)" }} />
            
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div>
                <h2 className="font-bold text-xl" style={{ color: "var(--txt)" }}>Nouvelle poche</h2>
                <p className="mono text-[10px] uppercase tracking-wider mt-1" style={{ color: "var(--txt-mute)" }}>Saisie des caractéristiques</p>
              </div>
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(206,51,65,0.1)", border: "1px solid rgba(206,51,65,0.2)" }}>
                <Droplet size={18} style={{ color: "var(--blood)" }} />
              </div>
            </div>

            {/* Groupe Sanguin */}
            <div className="mb-5 relative z-10">
              <label className="block mono text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--txt-dim)" }}>1. Groupe Sanguin</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((g) => {
                  const isSelected = groupe === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGroupe(g)}
                      className="font-bold text-lg py-3 rounded-2xl transition-all duration-200 relative overflow-hidden group"
                      style={{
                        background: isSelected ? "var(--blood)" : "var(--surface-2)",
                        color: isSelected ? "#fff" : "var(--txt-dim)",
                        border: `1px solid ${isSelected ? "var(--blood)" : "var(--line)"}`,
                        boxShadow: isSelected ? "0 4px 12px rgba(206,51,65,0.3)" : "none",
                      }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                      )}
                      <span className="relative z-10">
                        {g.replace(/[+-]/, "")}
                        <span className="text-base opacity-90 ml-0.5">{g.includes("-") ? "−" : "+"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hôpital */}
            <div className="mb-5 relative z-10">
              <label className="block mono text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--txt-dim)" }}>2. Centre de prélèvement</label>
              <Select
                value={hospital}
                onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full pl-4 pr-10 py-3 rounded-2xl mono text-sm font-bold transition-all duration-200"
                style={{ background: "transparent", border: "1px solid var(--line)", outline: "none" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--txt-mute)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
              >
                <option value="" disabled>— Choisir l'hôpital —</option>
                {inv.data?.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
                ))}
              </Select>
            </div>

            {/* Dates */}
            <div className="mb-5 relative z-10">
              <label className="block mono text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--txt-dim)" }}>3. Traçabilité temporelle</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Date Prélèvement */}
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--txt-mute)" }} />
                  <input
                    type="date"
                    value={prelevement}
                    onChange={(e) => setPrelevement(e.target.value)}
                    className="w-full mono text-sm rounded-2xl pl-10 pr-4 py-3 transition-all duration-200"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--txt)", outline: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--txt-mute)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                  />
                  <div className="absolute top-[-8px] left-4 px-2 mono text-[9px] font-bold uppercase tracking-widest rounded-sm" style={{ color: "var(--txt-dim)", background: "var(--surface)" }}>
                    Prélèvement
                  </div>
                </div>

                {/* Date Péremption */}
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: expiryTone }} />
                  <input
                    type="date"
                    value={peremption}
                    onChange={(e) => setPeremption(e.target.value)}
                    className="w-full mono text-sm rounded-2xl pl-10 pr-4 py-3 transition-all duration-200"
                    style={{ background: "var(--surface-2)", border: `1px solid ${dateError ? "var(--blood)" : "var(--line)"}`, color: "var(--txt)", outline: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--txt-mute)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                  />
                  <div className="absolute top-[-8px] left-4 px-2 mono text-[9px] font-bold uppercase tracking-widest rounded-sm" style={{ color: dateError ? "var(--blood)" : expiryTone, background: "var(--surface)" }}>
                    Péremption
                  </div>
                </div>

              </div>

              {/* Feedback expiration */}
              <div className="mt-3 flex flex-col gap-2 relative z-10">
                {dateError ? (
                  <div className="flex items-center gap-2 mono text-[11px] px-4 py-3 rounded-xl border" style={{ background: "rgba(206,51,65,0.08)", borderColor: "var(--blood)", color: "var(--blood)" }}>
                    <AlertTriangle size={14} />
                    {dateError}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mono text-[11px] px-4 py-3 rounded-xl border" style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--txt)" }}>
                    <CheckCircle2 size={14} style={{ color: expiryTone }} />
                    Validité : <span className="font-bold text-sm mx-1">{daysLeft}</span> jours restants
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 relative z-10">
              <Button
                type="submit"
                loading={saving}
                disabled={!!dateError || hospital === ""}
                className="w-full py-3 rounded-2xl text-[14px] font-bold"
                variant="clinic"
              >
                <Sparkles size={16} className="mr-2" />
                Créer la poche et générer l'UID
              </Button>
            </div>
          </form>
        </div>

        {/* ── COLONNE DROITE : Dernière Poche ── */}
        <div className="w-full xl:w-[42%] shrink-0 flex flex-col gap-6">
          <div className="h-full p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--line)", minHeight: "480px" }}>
            
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full" style={{ background: "var(--blood)" }} />
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full" style={{ background: "var(--ok)" }} />
            </div>

            {!last ? (
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full flex items-center justify-center mb-8" style={{ border: "2px dashed var(--line)", background: "var(--surface-2)" }}>
                  <Scan size={36} style={{ color: "var(--txt-mute)" }} />
                </div>
                <h3 className="font-bold text-2xl mb-3" style={{ color: "var(--txt-dim)" }}>Aucune poche</h3>
                <p className="mono text-sm max-w-[240px] leading-relaxed" style={{ color: "var(--txt-mute)" }}>
                  L'identifiant unique et le QR Code apparaîtront ici après l'enregistrement.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full max-w-[360px] p-8 rounded-3xl relative z-10" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                
                {/* Success indicator */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: "var(--ok)", color: "white" }}>
                  <CheckCircle2 size={14} />
                  <span className="mono text-[11px] font-bold uppercase">Enregistrée</span>
                </div>

                <div className="w-full flex justify-between items-start mb-8 mt-4">
                  <div className="flex flex-col">
                    <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--txt-mute)" }}>Identifiant Unique</span>
                    <span className="mono font-bold text-base mt-2" style={{ color: "var(--txt)" }}>{last.uid}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--txt-mute)" }}>Groupe</span>
                    <span className="font-black text-3xl" style={{ color: "var(--blood)" }}>
                      {last.groupe_sanguin.replace(/[+-]/, "")}
                      <span className="text-lg">{last.groupe_sanguin.includes("-") ? "−" : "+"}</span>
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="relative p-4 rounded-2xl mb-6 bg-white shadow-lg" style={{ border: "1px solid var(--line)" }}>
                  <img src={last.qr_code_b64} alt={`QR ${last.uid}`} className="w-40 h-40" style={{ mixBlendMode: "multiply" }} />
                  {/* Scanner corners */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: "var(--blood)" }} />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: "var(--blood)" }} />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: "var(--blood)" }} />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: "var(--blood)" }} />
                </div>

                <div className="w-full flex items-center justify-between py-5 mb-6" style={{ borderTop: "1px dashed var(--line)", borderBottom: "1px dashed var(--line)" }}>
                  <div className="flex flex-col">
                    <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Prélèvement</span>
                    <span className="mono text-sm mt-1" style={{ color: "var(--txt)" }}>{last.date_prelevement}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Péremption</span>
                    <span className="mono text-sm mt-1 font-bold" style={{ color: daysUntilExpiry(last.date_peremption) < 14 ? "var(--blood)" : "var(--txt)" }}>
                      {last.date_peremption}
                    </span>
                  </div>
                </div>

                <Button variant="secondary" onClick={() => downloadQr(last)} className="w-full rounded-2xl py-3">
                  <Download size={18} className="mr-2" /> Exporter QR Code
                </Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
