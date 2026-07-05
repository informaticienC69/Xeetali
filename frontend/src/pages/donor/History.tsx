import { api } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { Card, EmptyState, GroupBadge, Skeleton } from "../../components/ui";

export default function History() {
  const donations = useApi(() => api.myDonations(), []);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Mes dons (UC-18)</h1>

      <Card title="Historique">
        {donations.loading ? (
          <Skeleton className="h-32" />
        ) : !donations.data?.length ? (
          <EmptyState message="Aucun don enregistré pour l'instant." />
        ) : (
          <ul className="space-y-2">
            {donations.data.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🩸</span>
                  <div>
                    <div className="font-medium text-slate-700">{new Date(d.date).toLocaleDateString("fr-FR")}</div>
                    <div className="text-xs text-slate-400">{d.volume} ml</div>
                  </div>
                </div>
                <GroupBadge groupe={d.groupe_sanguin} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
