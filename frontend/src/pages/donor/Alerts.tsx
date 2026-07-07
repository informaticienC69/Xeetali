// Alerts.tsx — Donor · Command Center
import { AlertTriangle, Bell, CheckCircle, XCircle } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, EmptyState, GroupBadge, Skeleton, PageHeader } from "../../components/ui";

export default function Alerts() {
  const toast = useToast();
  const alerts = useApi(() => api.listAlerts(), []);

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
              className="card-in glow-blood-strong"
              style={{
                background: "linear-gradient(135deg, rgba(230,57,70,0.12), rgba(230,57,70,0.04))",
                border: "1px solid rgba(230,57,70,0.40)",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl pulse-soft"
                  style={{ background: "rgba(230,57,70,0.15)", border: "1px solid rgba(230,57,70,0.35)" }}
                >
                  <AlertTriangle size={18} style={{ color: "var(--blood)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="syne font-bold" style={{ color: "var(--txt)" }}>Besoin de sang</span>
                    <GroupBadge groupe={a.groupe_sanguin} />
                    <span className="mono text-[10px] uppercase" style={{ color: "var(--txt-mute)" }}>· {a.portee.toLowerCase()}</span>
                  </div>
                  <p className="mono text-[12px]" style={{ color: "var(--txt-dim)" }}>{a.message}</p>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => respond(a.id, true)}>
                      <CheckCircle size={14} /> Je suis disponible
                    </Button>
                    <Button variant="secondary" onClick={() => respond(a.id, false)}>
                      <XCircle size={14} /> Pas disponible
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
