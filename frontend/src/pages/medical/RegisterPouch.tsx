// RegisterPouch.tsx — Refonte UX Premium "Workspace"
import { useMemo, useState } from "react";
import { Calendar, Download, Droplet, Plus, Scan } from "lucide-react";
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
        <div className="grow w-full xl:w-[60%] flex flex-col gap-6 relative group perspective-container card-in">
          <div className="absolute -inset-2 bg-linear-to-r from-red-500/10 via-transparent to-red-500/5 rounded-[40px] blur-xl opacity-60 pointer-events-none holo-shimmer"></div>
          <form onSubmit={submit} className="relative h-full flex flex-col p-8 rounded-[32px] transition-all duration-500 tilt-card hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(230,57,70,0.08)]" style={{ background: "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)", border: "1px solid color-mix(in srgb, var(--line) 40%, transparent)", boxShadow: "0 20px 50px rgba(0,0,0,0.05), inset 0 2px 0 rgba(255,255,255,0.4)" }}>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="syne font-bold text-xl" style={{ color: "var(--txt)" }}>Nouvelle poche</h2>
                <p className="mono text-[10px] uppercase tracking-wider mt-1.5" style={{ color: "var(--txt-mute)" }}>Saisie des caractéristiques</p>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500" style={{ background: "rgba(230,57,70,0.1)" }}>
                <div className="absolute inset-0 bg-red-500/20 drop-fill opacity-0 group-hover:opacity-100 transition-opacity" />
                <Droplet size={16} className="relative z-10 heartbeat" style={{ color: "var(--blood)" }} />
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
                      className="relative syne font-bold text-lg py-4 rounded-2xl transition-all duration-300 overflow-hidden group"
                      style={{
                        background: groupe === g ? "linear-gradient(135deg, var(--blood), #c1232f)" : "var(--surface)",
                        color: groupe === g ? "#fff" : "var(--txt-dim)",
                        border: `1px solid ${groupe === g ? "transparent" : "var(--line)"}`,
                        boxShadow: groupe === g ? "0 12px 24px rgba(230,57,70,0.3)" : "0 4px 12px rgba(0,0,0,0.02)",
                        transform: groupe === g ? "translateY(-3px) scale(1.02)" : "translateY(0)"
                      }}
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
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
            <div className="mb-6 relative z-20">
              <label className="block mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--txt-mute)" }}>2. Centre de prélèvement</label>
              <div className="relative group">
                <Select
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full pl-4 pr-10 py-4 rounded-2xl mono text-xs font-bold transition-all duration-300 cursor-pointer hover:shadow-lg"
                  style={{ background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--line) 60%, transparent)", outline: "none", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.02)" }}
                >
                  <option value="" disabled>— Choisir l'hôpital —</option>
                  {inv.data?.map((h) => (
                    <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
                  ))}
                </Select>
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-red-500/10 pointer-events-none transition-colors" />
              </div>
            </div>

            {/* Dates */}
            <div className="mb-8">
              <label className="block mono text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--txt-mute)" }}>3. Traçabilité temporelle</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Date Prélèvement */}
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--txt-dim)" }} />
                  <input
                    type="date"
                    value={prelevement}
                    onChange={(e) => setPrelevement(e.target.value)}
                    className="w-full mono text-xs rounded-2xl pl-10 pr-4 py-4 transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--txt)", outline: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--txt-mute)", e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.05)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)", e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.02)")}
                  />
                  <div className="absolute top-[-8px] left-4 px-1.5 mono text-[9px] font-bold uppercase tracking-widest bg-white rounded-sm" style={{ color: "var(--txt-dim)" }}>
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
                    className="w-full mono text-xs rounded-2xl pl-10 pr-4 py-4 transition-all"
                    style={{ background: "var(--surface)", border: `1px solid ${dateError ? "var(--blood)" : "var(--line)"}`, color: "var(--txt)", outline: "none", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = expiryTone, e.currentTarget.style.boxShadow = `0 0 0 3px ${expiryTone}20`)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)", e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.02)")}
                  />
                  <div className="absolute top-[-8px] left-4 px-1.5 mono text-[9px] font-bold uppercase tracking-widest bg-white rounded-sm" style={{ color: dateError ? "var(--blood)" : expiryTone }}>
                    Péremption
                  </div>
                </div>

              </div>

              {/* Feedback expiration */}
              <div className="mt-4 flex flex-col gap-2 relative z-10">
                {dateError ? (
                  <div className="flex items-center gap-2 mono text-[11px] px-5 py-3 rounded-xl border" style={{ background: "rgba(230,57,70,0.05)", borderColor: "rgba(230,57,70,0.2)", color: "var(--blood)" }}>
                    <span className="w-2 h-2 rounded-full bg-(--blood) pulse-blood" />
                    {dateError}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mono text-[11px] px-5 py-3 rounded-xl transition-all border" style={{ background: daysLeft < 14 ? 'rgba(230,57,70,0.05)' : `${expiryTone}10`, borderColor: daysLeft < 14 ? 'rgba(230,57,70,0.2)' : `${expiryTone}20`, color: expiryTone }}>
                    <span className={`w-2 h-2 rounded-full ${daysLeft < 14 ? 'pulse-blood' : 'glow-ok'}`} style={{ background: expiryTone }} />
                    Validité : <span className="font-extrabold text-sm mx-1">{daysLeft}</span> jours restants
                    {daysLeft < 14 && <span className="uppercase font-bold tracking-widest text-[9px] ml-1 px-1.5 py-0.5 rounded bg-(--blood) text-white heartbeat">Critique</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <Button
                type="submit"
                loading={saving}
                disabled={!!dateError || hospital === ""}
                className="w-full py-4 rounded-2xl text-[15px] font-extrabold tracking-wide shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl bg-linear-to-br from-[#ef3a48] to-[#a81c26] text-white border-none"
              >
                Créer la poche et générer l'UID
              </Button>
            </div>
          </form>
        </div>

        {/* ── COLONNE DROITE : DIGITAL TWIN (Dernière Poche) ── */}
        <div className="w-full xl:w-[40%] shrink-0 flex flex-col gap-6 relative group perspective-container card-in delay-120">
          <div className="absolute -inset-2 bg-linear-to-tr from-rose-100 to-teal-50 rounded-[40px] blur-xl opacity-60 pointer-events-none holo-shimmer"></div>
          <div className="relative h-full p-8 rounded-[32px] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/60 tilt-card hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)]" style={{ border: "1px solid rgba(255,255,255,0.8)", minHeight: "420px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
            
            {/* Background design elements & Particles */}
            <Droplet size={300} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(230,57,70,0.03)" }} />
            
            {/* Particules flottantes "Holographiques" */}
            <div className="absolute top-12 left-12 w-2 h-2 rounded-full bg-red-400 particle" style={{ "--dur": "4s", "--delay": "0s" } as any} />
            <div className="absolute bottom-24 right-12 w-3 h-3 rounded-full bg-teal-400 particle" style={{ "--dur": "6s", "--delay": "1s" } as any} />
            <div className="absolute top-1/2 left-8 w-1 h-1 rounded-full bg-yellow-400 particle" style={{ "--dur": "3s", "--delay": "0.5s" } as any} />
            <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-purple-400 particle" style={{ "--dur": "5s", "--delay": "2s" } as any} />

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
              <div className="relative z-10 flex flex-col items-center w-full max-w-[340px] p-8 rounded-[32px] bounce-in-scale" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)", boxShadow: "0 24px 48px rgba(0,0,0,0.08), inset 0 2px 0 rgba(255,255,255,1), 0 0 0 1px rgba(0,0,0,0.05)" }}>
                
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
                  <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-(--blood)" />
                  <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-(--blood)" />
                  <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-(--blood)" />
                  <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-(--blood)" />
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
