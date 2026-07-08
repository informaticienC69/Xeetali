// RegisterPouch.tsx — Refonte UX Premium "Workspace"
import { useMemo, useState } from "react";
import { Calendar, Download, Droplet, MapPin, Plus, Scan } from "lucide-react";
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
        
        {/* ── COLONNE GAUCHE : FORMULAIRE PREMIUM ── */}
        <div className="grow w-full xl:w-[60%] flex flex-col gap-6">
          <form onSubmit={submit} className="h-full flex flex-col p-6 rounded-3xl transition-all duration-500" style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="syne font-bold text-xl" style={{ color: "var(--txt)" }}>Nouvelle poche</h2>
                <p className="mono text-[10px] uppercase tracking-wider mt-1.5" style={{ color: "var(--txt-mute)" }}>Saisie des caractéristiques</p>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(230,57,70,0.1)" }}>
                <Droplet size={16} style={{ color: "var(--blood)" }} />
              </div>
            </div>

            {/* Groupe Sanguin */}
            <div className="mb-6">
              <label className="block mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--txt-mute)" }}>1. Groupe Sanguin</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroupe(g)}
                    className="relative syne font-bold text-lg py-3 rounded-xl transition-all duration-300 overflow-hidden"
                    style={{
                      background: groupe === g ? "var(--blood)" : "var(--surface-2)",
                      color: groupe === g ? "#fff" : "var(--txt-dim)",
                      border: `1px solid ${groupe === g ? "var(--blood)" : "var(--line)"}`,
                      boxShadow: groupe === g ? "0 8px 24px rgba(230,57,70,0.3)" : "none",
                      transform: groupe === g ? "translateY(-2px)" : "none"
                    }}
                  >
                    {groupe === g && (
                      <div className="absolute inset-0 bg-white opacity-20" style={{ clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 100%)" }} />
                    )}
                    <span className="relative z-10">
                      {g.replace(/[+-]/, "")}
                      <span className="text-sm opacity-80 ml-0.5">{g.includes("-") ? "−" : "+"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hôpital */}
            <div className="mb-6">
              <label className="block mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--txt-mute)" }}>2. Centre de prélèvement</label>
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

            {/* Dates */}
            <div className="mb-8">
              <label className="block mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--txt-mute)" }}>3. Traçabilité temporelle</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Date Prélèvement */}
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--txt-dim)" }} />
                  <input
                    type="date"
                    value={prelevement}
                    onChange={(e) => setPrelevement(e.target.value)}
                    className="w-full mono text-xs rounded-xl pl-9 pr-3 py-3 transition-all"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--txt)", outline: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--txt-mute)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                  />
                  <div className="absolute top-[-7px] left-3.5 px-1 mono text-[8px] uppercase tracking-wider bg-[var(--surface)]" style={{ color: "var(--txt-dim)" }}>
                    Prélèvement
                  </div>
                </div>

                {/* Date Péremption */}
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: expiryTone }} />
                  <input
                    type="date"
                    value={peremption}
                    onChange={(e) => setPeremption(e.target.value)}
                    className="w-full mono text-xs rounded-xl pl-9 pr-3 py-3 transition-all"
                    style={{ background: "var(--surface-2)", border: `1px solid ${dateError ? "var(--blood)" : "var(--line)"}`, color: "var(--txt)", outline: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = expiryTone)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                  />
                  <div className="absolute top-[-7px] left-3.5 px-1 mono text-[8px] uppercase tracking-wider bg-[var(--surface)]" style={{ color: dateError ? "var(--blood)" : expiryTone }}>
                    Péremption
                  </div>
                </div>

              </div>

              {/* Feedback expiration */}
              <div className="mt-4 flex flex-col gap-2">
                {dateError ? (
                  <div className="flex items-center gap-2 mono text-[11px] px-4 py-2 rounded-lg" style={{ background: "rgba(230,57,70,0.1)", color: "var(--blood)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--blood)]" />
                    {dateError}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mono text-[11px] px-4 py-2 rounded-lg transition-all" style={{ background: `${expiryTone}15`, color: expiryTone }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: expiryTone }} />
                    Validité : {daysLeft} jours restants
                    {daysLeft < 14 && " (Critique)"}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <Button
                type="submit"
                loading={saving}
                disabled={!!dateError || hospital === ""}
                className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg hover:-translate-y-0.5 transition-transform"
              >
                Créer la poche et générer l'UID
              </Button>
            </div>
          </form>
        </div>

        {/* ── COLONNE DROITE : DIGITAL TWIN (Dernière Poche) ── */}
        <div className="w-full xl:w-[40%] shrink-0 flex flex-col gap-6">
          <div className="h-full p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500" style={{ background: "var(--surface-2)", border: "1px solid var(--line)", minHeight: "420px" }}>
            
            {/* Background design elements */}
            <Droplet size={300} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(230,57,70,0.03)" }} />

            {!last ? (
              <div className="relative z-10 flex flex-col items-center text-center opacity-60">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ border: "2px dashed var(--line)", background: "var(--surface)" }}>
                  <Scan size={32} style={{ color: "var(--txt-mute)" }} />
                </div>
                <h3 className="syne font-bold text-xl mb-2" style={{ color: "var(--txt-dim)" }}>Aucune poche</h3>
                <p className="mono text-xs max-w-[200px]" style={{ color: "var(--txt-mute)" }}>
                  L'identifiant unique et le QR Code apparaîtront ici après l'enregistrement.
                </p>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center w-full max-w-[320px] p-6 rounded-[24px] card-in" style={{ background: "var(--surface)", boxShadow: "0 12px 40px rgba(0,0,0,0.1), 0 0 0 1px var(--line)" }}>
                
                <div className="w-full flex justify-between items-start mb-6">
                  <div className="flex flex-col">
                    <span className="mono text-[9px] uppercase tracking-widest" style={{ color: "var(--txt-mute)" }}>Identifiant Unique</span>
                    <span className="mono font-bold text-sm mt-1" style={{ color: "var(--txt)" }}>{last.uid}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="mono text-[9px] uppercase tracking-widest" style={{ color: "var(--txt-mute)" }}>Groupe</span>
                    <span className="syne font-black text-2xl" style={{ color: "var(--blood)" }}>
                      {last.groupe_sanguin.replace(/[+-]/, "")}
                      <span className="text-base">{last.groupe_sanguin.includes("-") ? "−" : "+"}</span>
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="relative p-3 rounded-xl mb-4 bg-white" style={{ border: "1px solid var(--line)" }}>
                  <img src={last.qr_code_b64} alt={`QR ${last.uid}`} className="w-36 h-36" style={{ mixBlendMode: "multiply" }} />
                  {/* Scanner corners */}
                  <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[var(--blood)]" />
                  <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[var(--blood)]" />
                  <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[var(--blood)]" />
                  <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[var(--blood)]" />
                </div>

                <div className="w-full flex items-center justify-between py-4 mb-4" style={{ borderTop: "1px dashed var(--line)", borderBottom: "1px dashed var(--line)" }}>
                  <div className="flex flex-col">
                    <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Prélèvement</span>
                    <span className="mono text-xs mt-1" style={{ color: "var(--txt)" }}>{last.date_prelevement}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Péremption</span>
                    <span className="mono text-xs mt-1 font-bold" style={{ color: daysUntilExpiry(last.date_peremption) < 14 ? "var(--blood)" : "var(--txt)" }}>
                      {last.date_peremption}
                    </span>
                  </div>
                </div>

                <Button variant="secondary" onClick={() => downloadQr(last)} className="w-full rounded-xl">
                  <Download size={16} /> Exporter QR Code
                </Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
