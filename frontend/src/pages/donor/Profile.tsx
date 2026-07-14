// Profile.tsx — Donor · UX Masterpiece
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, User, ChevronDown, XCircle, Check } from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useAuth } from "../../lib/auth";
import { Button, Skeleton, PageHeader } from "../../components/ui";

function HolographicID({ form }: { form: any }) {
  const { nom, userId } = useAuth();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rotX = ((y / rect.height) - 0.5) * -30;
    const rotY = ((x / rect.width) - 0.5) * 30;
    
    setRotation({ x: rotX, y: rotY });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  }

  function handleMouseLeave() {
    setRotation({ x: 0, y: 0 });
    setGlare({ ...glare, opacity: 0 });
  }

  const cardBg = isDarkMode ? "linear-gradient(135deg, #0f1629 0%, #1a2035 100%)" : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
  const textColor = isDarkMode ? "white" : "#0f172a";
  const gridColor = isDarkMode ? "#fff" : "#000";
  const glareColor = isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)";

  return (
    <div className="w-full relative z-20 mb-10 mt-6" style={{ perspective: 1000 }}>
      <div 
        className="relative w-full rounded-3xl overflow-hidden transition-transform duration-300 ease-out shadow-2xl"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: "preserve-3d",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          height: 220
        }}
      >
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-30"
          style={{ 
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${glareColor} 0%, transparent 60%)`,
            mixBlendMode: isDarkMode ? "overlay" : "normal"
          }} 
        />

        {/* Liquid Sphere */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full z-10"
             style={{ 
               background: "radial-gradient(circle at 30% 30%, #ff4b5c, var(--blood-dim))",
               boxShadow: isDarkMode 
                 ? "inset -10px -10px 20px rgba(0,0,0,0.5), inset 10px 10px 20px rgba(255,255,255,0.4), 0 0 40px rgba(206,51,65,0.5)"
                 : "inset -10px -10px 20px rgba(0,0,0,0.2), inset 10px 10px 20px rgba(255,255,255,0.9), 0 10px 30px rgba(206,51,65,0.35)",
               transform: "translateZ(40px)"
             }}>
             <div className="absolute inset-0 flex items-center justify-center font-black text-4xl text-white drop-shadow-lg" style={{ transform: "translateZ(20px)" }}>
               {form.groupe_sanguin}
             </div>
        </div>

        {/* Background Network */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `radial-gradient(circle, ${gridColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between z-20" style={{ transform: "translateZ(30px)", color: textColor }}>
           {/* Header */}
           <div className="flex justify-between items-start">
             <div>
               <div className="flex items-center gap-2 mono text-[10px] tracking-[0.2em] opacity-80 mb-1 font-bold">
                  <ShieldCheck size={14} style={{ color: "var(--blood)" }} /> CARTE NATIONALE DE DONNEUR
               </div>
               <div className="mono text-[11px] tracking-widest opacity-60">
                 SN-DON-{userId?.toString().padStart(6, '0')}
               </div>
             </div>
           </div>
           
           <div className="flex flex-col gap-4 mt-2 pr-36">
             <div>
               <div className="mono text-[9px] tracking-[0.15em] opacity-50 mb-0.5 font-bold">NOM COMPLET</div>
               <div className={`font-bold text-xl tracking-wide uppercase bg-clip-text text-transparent ${isDarkMode ? "bg-linear-to-r from-white to-white/70" : "bg-linear-to-r from-slate-900 to-slate-600"}`}>
                  {nom || "DONNEUR ANONYME"}
               </div>
             </div>

             <div className="flex gap-8">
               <div>
                 <div className="mono text-[8px] tracking-[0.15em] opacity-50 mb-0.5 font-bold">LOCALITÉ</div>
                 <div className="mono font-semibold text-[13px] tracking-wide uppercase">{form.localisation || "---"}</div>
               </div>
               <div>
                 <div className="mono text-[8px] tracking-[0.15em] opacity-50 mb-0.5 font-bold">TÉLÉPHONE</div>
                 <div className="mono font-semibold text-[13px] tracking-wide">{form.telephone || "---"}</div>
               </div>
               <div>
                 <div className="mono text-[8px] tracking-[0.15em] opacity-50 mb-0.5 font-bold">DERNIER DON</div>
                 <div className="mono font-semibold text-[13px] tracking-wide">{form.date_dernier_don ? new Date(form.date_dernier_don).toLocaleDateString('fr-FR') : "N/A"}</div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function FloatingInput({ value, onChange, label, type="text", required=false }: any) {
  return (
    <div className="relative group mt-8">
      <input 
         type={type}
         value={value}
         onChange={onChange}
         required={required}
         placeholder=" "
         className="peer w-full bg-transparent border-b-2 border-transparent py-2 text-lg transition-colors focus:outline-none focus:border-(--blood)"
         style={{ color: "var(--txt)", borderBottomColor: "var(--line)" }}
      />
      <label className="absolute left-0 top-3 text-(--txt-mute) mono text-sm transition-all pointer-events-none peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-(--blood) peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-(--txt-mute) peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-(--txt-dim)">
        {label}
      </label>
    </div>
  );
}

function FloatingCustomSelect({ value, onChange, label, options }: any) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="relative group mt-8 cursor-pointer" onClick={() => setOpen(true)}>
        <div 
           className="peer w-full bg-transparent border-b-2 py-2 text-lg transition-colors flex items-center justify-between hover:border-(--blood)"
           style={{ color: "var(--txt)", borderBottomColor: open ? "var(--blood)" : "var(--line)" }}
        >
          {value}
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            style={{ color: open ? "var(--blood)" : "var(--txt-mute)" }}
          />
        </div>
        <label className={`absolute left-0 transition-all pointer-events-none ${open ? "-top-4 text-[10px] text-(--blood)" : "-top-4 text-[10px] text-(--txt-dim) group-hover:text-(--blood)"}`}>
          {label}
        </label>
      </div>

      {open && createPortal(
        <div
          className="fixed inset-0 z-120 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="modal-pop w-full overflow-hidden flex flex-col"
            style={{
              maxWidth: 360,
              maxHeight: "75vh",
              borderRadius: 20,
              border: "1px solid var(--blood-glow)",
              background: "var(--surface)",
              boxShadow: "0 0 0 1px var(--line), 0 32px 64px rgba(0,0,0,0.35), 0 0 60px var(--blood-glow)",
            }}
          >
            {/* Header */}
            <div
              className="relative px-5 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div
                className="absolute top-0 left-6 right-6 rounded-b-full"
                style={{ height: 2, background: "linear-gradient(90deg, transparent, var(--blood) 40%, transparent)" }}
              />
              <div>
                <div className="mono text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ color: "var(--blood)" }}>
                  Sélection
                </div>
                <div className="font-bold text-[17px]" style={{ color: "var(--txt)" }}>
                  Choisir une option
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  color: "var(--txt-mute)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(206,51,65,0.15)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(206,51,65,0.4)";
                  (e.currentTarget as HTMLElement).style.color = "var(--blood)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                  (e.currentTarget as HTMLElement).style.color = "var(--txt-mute)";
                }}
              >
                <XCircle size={16} />
              </button>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--line) transparent" }}>
              {options.map((opt: string, i: number) => {
                const isSelected = opt === value;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (onChange) onChange(opt);
                      setOpen(false);
                    }}
                    className="group w-full text-left flex items-center justify-between gap-3 rounded-xl transition-all cursor-pointer mb-1"
                    style={{
                      padding: "11px 14px",
                      background: isSelected
                        ? "linear-gradient(90deg, rgba(206,51,65,0.15) 0%, rgba(206,51,65,0.05) 100%)"
                        : "transparent",
                      border: `1px solid ${isSelected ? "rgba(206,51,65,0.3)" : "transparent"}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--line-2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="shrink-0 rounded-full transition-all"
                        style={{
                          width: 6,
                          height: 6,
                          background: isSelected ? "var(--blood)" : "var(--txt-mute)",
                          boxShadow: isSelected ? "0 0 8px var(--blood-glow)" : "none",
                        }}
                      />
                      <span
                        className="font-semibold text-[14px] truncate"
                        style={{ color: isSelected ? "var(--txt)" : "var(--txt-dim)" }}
                      >
                        {opt}
                      </span>
                    </div>

                    {isSelected && (
                      <div
                        className="shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: 20,
                          height: 20,
                          background: "rgba(206,51,65,0.2)",
                          border: "1px solid rgba(206,51,65,0.4)",
                        }}
                      >
                        <Check size={11} style={{ color: "var(--blood)" }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function Profile() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    groupe_sanguin: "O+" as BloodGroup,
    telephone: "",
    localisation: "",
    date_dernier_don: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const p = await api.myProfile();
        setForm({ groupe_sanguin: p.groupe_sanguin, telephone: p.telephone, localisation: p.localisation, date_dernier_don: p.date_dernier_don ?? "" });
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) toast.error("Erreur de chargement.");
      } finally { setLoading(false); }
    })();
  }, [toast]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.upsertProfile({ groupe_sanguin: form.groupe_sanguin, telephone: form.telephone, localisation: form.localisation, date_dernier_don: form.date_dernier_don || null });
      toast.success("Profil enregistré.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally { setSaving(false); }
  }

  if (loading) return <Skeleton className="h-64 rounded-3xl" />;

  return (
    <div className="space-y-2 pb-10">
      <PageHeader
        title="Mon profil"
        subtitle="Identité Visuelle"
        icon={User}
      />

      <HolographicID form={form} />

      <form onSubmit={submit} className="card-in relative px-6 py-8 rounded-3xl" style={{ background: "linear-gradient(145deg, var(--surface) 0%, var(--bg-2) 100%)", border: "1px solid var(--line)" }}>
        <h3 className="font-bold text-xl mb-6" style={{ color: "var(--txt)" }}>Mettre à jour</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <FloatingCustomSelect label="GROUPE SANGUIN" value={form.groupe_sanguin} onChange={(v: any) => setForm({ ...form, groupe_sanguin: v as BloodGroup })} options={BLOOD_GROUPS} />
          <FloatingInput label="TÉLÉPHONE" value={form.telephone} onChange={(e: any) => setForm({ ...form, telephone: e.target.value })} required />
        </div>
        
        <FloatingInput label="VILLE / LOCALITÉ" value={form.localisation} onChange={(e: any) => setForm({ ...form, localisation: e.target.value })} required />
        
        <FloatingInput label="DATE DERNIER DON (OPTIONNEL)" type="date" value={form.date_dernier_don} onChange={(e: any) => setForm({ ...form, date_dernier_don: e.target.value })} />
        
        <Button type="submit" loading={saving} className="w-full mt-10 h-14 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
          Synchroniser l'Identité
        </Button>
      </form>
    </div>
  );
}
