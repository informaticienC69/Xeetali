import { Bell } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, GroupBadge, Skeleton } from "../../components/ui";

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
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Alertes en cours (UC-17)</h1>

      {alerts.loading ? (
        <Skeleton className="h-40" />
      ) : !alerts.data?.length ? (
        <EmptyState message="Aucune alerte active pour le moment." />
      ) : (
        <div className="space-y-3">
          {alerts.data.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <Bell size={18} />
                </span>
                <div className="grow">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Besoin de sang</span>
                    <GroupBadge groupe={a.groupe_sanguin} />
                    <span className="text-xs text-slate-400 dark:text-slate-500">· {a.portee.toLowerCase()}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.message}</p>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => respond(a.id, true)}>Je suis disponible</Button>
                    <Button variant="secondary" onClick={() => respond(a.id, false)}>Pas disponible</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
