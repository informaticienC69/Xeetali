import { api, BLOOD_GROUPS } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { Card, GroupBadge, Skeleton } from "../../components/ui";
import InventoryTable from "../../components/InventoryTable";

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`text-2xl font-bold ${accent ? "text-red-600" : "text-slate-800"}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const stats = useApi(() => api.dashboard(), []);
  const inv = useApi(() => api.inventory(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Tableau de bord national</h1>
        <p className="text-sm text-slate-500">Vue consolidée des stocks et de l'activité CNTS.</p>
      </div>

      {stats.loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : stats.data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Poches disponibles" value={stats.data.total_poches_disponibles} accent />
          <Stat label="Hôpitaux" value={stats.data.nb_hopitaux} />
          <Stat label="Donneurs" value={stats.data.nb_donneurs} />
          <Stat label="Demandes ouvertes" value={stats.data.demandes_ouvertes} />
          <Stat label="Alertes actives" value={stats.data.alertes_actives} />
          <Stat
            label="Groupes en stock"
            value={stats.data.stock_national_par_groupe.filter((g) => g.quantite > 0).length}
          />
        </div>
      ) : null}

      <Card title="Stock national par groupe sanguin">
        {stats.loading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {BLOOD_GROUPS.map((g) => {
              const q = stats.data?.stock_national_par_groupe.find((x) => x.groupe_sanguin === g)?.quantite ?? 0;
              return (
                <div key={g} className="flex flex-col items-center gap-1 rounded-lg border border-slate-100 py-3">
                  <GroupBadge groupe={g} />
                  <span className={`text-lg font-bold ${q < 5 ? "text-amber-600" : "text-slate-800"}`}>{q}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Stocks par hôpital">
        {inv.loading ? <Skeleton className="h-40" /> : inv.data ? <InventoryTable inventory={inv.data} /> : null}
      </Card>
    </div>
  );
}
