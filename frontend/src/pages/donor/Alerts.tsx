// Alerts.tsx — Donor · Command Center
import { AlertTriangle, Bell, CheckCircle, HeartPulse, Droplet, Building2, Clock } from "lucide-react";
import { api, ApiError, type UrgencyStats } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { EmptyState, GroupBadge, Skeleton, PageHeader } from "../../components/ui";

/* ─── UrgencyBanner ──────────────────────────────────────────── */
function UrgencyBanner({ u }: { u: UrgencyStats | null }) {
  const CAPACITY = u?.capacite_pct ?? 12;
  const LIVES    = u?.vies_en_attente ?? 8;
  const GROUPE   = u?.groupe_critique ?? "O−";
  const REGIONS  = u?.regions ?? "Dakar, Thiès, Saint-Louis";

  return (
    <div
      className="card-in relative overflow-hidden mb-6"
      style={{
        borderRadius: 24,
        padding: "24px",
        background: "linear-gradient(145deg, var(--surface) 0%, var(--bg-2) 100%)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-lg)",
        animationDelay: "120ms",
      }}
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, var(--blood-glow) 0%, transparent 70%)", filter: "blur(40px)" }} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mono text-[10px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--blood)" }}>
            <AlertTriangle size={12} className="pulse-soft" />
            <span>Alerte nationale · {GROUPE} critique</span>
          </div>
          <div className="font-extrabold text-xl mt-1 leading-tight" style={{ color: "var(--txt)" }}>
            <span className="pulse-text" style={{ color: "var(--blood)" }}>{LIVES} vies</span>{" "}
            en attente aujourd'hui
          </div>
          <div className="mono text-[11px] mt-0.5" style={{ color: "var(--txt-dim)" }}>
            dans votre région · {REGIONS}
          </div>
        </div>

        <div className="relative shrink-0 ml-4" style={{ width: 32, height: 70 }}>
          {/* Tube background */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
          >
            {/* Liquid fill */}
            <div
              className="absolute bottom-0 left-0 right-0 drop-fill rounded-full"
              style={{
                height: `${CAPACITY}%`,
                background: "linear-gradient(180deg, rgba(206,51,65,0.85) 0%, var(--blood) 100%)",
                boxShadow: "0 0 8px var(--blood)",
              }}
            />
          </div>
          {/* Pourcentage */}
          <div
            className="absolute -bottom-6 left-0 right-0 text-center mono font-bold text-[11px]"
            style={{ color: "var(--blood)" }}
          >
            {CAPACITY}%
          </div>
        </div>
      </div>

      {/* Ticker info */}
      <div className="mt-6 overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}>
        <div className="ticker-track mono text-[10px]" style={{ color: "var(--txt-mute)", gap: 32 }}>
          {[
            <span className="flex items-center gap-1.5"><HeartPulse size={12} style={{ color: "var(--blood)" }} /> 3 vies par don</span>,
            <span className="flex items-center gap-1.5"><Droplet size={12} style={{ color: "var(--blood)" }} /> Groupe {GROUPE} · Stock critique</span>,
            <span className="flex items-center gap-1.5"><Building2 size={12} /> 8 hôpitaux en attente</span>,
            <span className="flex items-center gap-1.5"><Clock size={12} /> Besoin urgent Dakar</span>,
          ].map((t, i) => (
            <div key={i} className="flex items-center">{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Alerts() {
  const toast = useToast();
  const alerts = useApi(() => api.listAlerts(), []);
  const urgency = useApi(() => api.urgencyStats(), []);

  async function respond(id: number, disponible: boolean) {
    try {
      const res = await api.respondAlert(id, disponible);
      toast.success(res.instructions);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alertes en cours"
        subtitle="Flux temps réel"
        icon={Bell}
      />

      {/* Bannière d'urgence nationale */}
      <UrgencyBanner u={urgency.data} />

      {alerts.loading ? (
        <>
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </>
      ) : !alerts.data?.length ? (
        <div className="surface rounded-xl py-12 text-center">
          <CheckCircle size={32} className="mx-auto mb-3" style={{ color: "var(--ok)" }} />
          <EmptyState message="Aucune alerte active pour le moment." />
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.data.map((a) => (
            <div
              key={a.id}
              className="card-in relative overflow-hidden flex flex-col p-6 rounded-[32px] transition-all duration-500 group"
              style={{
                background: "linear-gradient(145deg, var(--surface) 0%, var(--bg-2) 100%)",
                border: "1px solid color-mix(in srgb, var(--blood) 30%, var(--line))",
                boxShadow: "0 20px 40px rgba(206,51,65,0.15)",
                marginBottom: "24px"
              }}
            >
              {/* Giant Watermark */}
              <AlertTriangle className="absolute -right-10 -top-10 w-64 h-64 opacity-[0.03] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" style={{ color: "var(--blood)" }} />
              
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "radial-gradient(circle at top right, var(--blood-glow) 0%, transparent 70%)" }} />

              <div className="relative z-10 flex items-start gap-4 mb-6">
                <div className="relative shrink-0">
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-2xl pulse-soft" style={{ background: "var(--blood)", opacity: 0.3, filter: "blur(12px)" }} />
                  <div
                    className="relative flex h-14 w-14 items-center justify-center rounded-[20px] shadow-xl transition-transform duration-500 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, var(--blood) 0%, var(--blood-dim) 100%)" }}
                  >
                    <AlertTriangle size={24} className="text-white drop-shadow-md" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 mt-0.5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-xl tracking-wide" style={{ color: "var(--txt)" }}>Urgence Sang</span>
                    <div className="scale-90 origin-left"><GroupBadge groupe={a.groupe_sanguin} /></div>
                  </div>
                  <div className="mono text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1.5 rounded-full w-fit" style={{ background: "color-mix(in srgb, var(--blood) 10%, transparent)", color: "var(--blood)", border: "1px solid color-mix(in srgb, var(--blood) 20%, transparent)" }}>
                    {a.portee}
                  </div>
                </div>
              </div>

              <p className="relative z-10 mono text-[13px] leading-relaxed mb-8" style={{ color: "var(--txt-dim)" }}>
                {a.message}
              </p>

              <div className="relative z-10 flex flex-col gap-3 mt-auto">
                <button 
                  onClick={() => respond(a.id, true)} 
                  className="w-full h-16 rounded-[24px] flex items-center justify-center gap-2 font-bold text-lg text-white shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, var(--blood) 0%, var(--blood-dim) 100%)" }}
                >
                  <HeartPulse size={20} className="pulse-soft" />
                  JE SUIS DISPONIBLE
                </button>
                <button 
                  onClick={() => respond(a.id, false)} 
                  className="w-full h-12 rounded-[16px] flex items-center justify-center gap-2 mono text-xs font-bold uppercase tracking-widest transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: "var(--txt-mute)" }}
                >
                  Je ne peux pas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
