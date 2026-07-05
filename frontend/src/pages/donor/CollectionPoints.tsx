import { useState } from "react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { Card, EmptyState, Input, Skeleton } from "../../components/ui";

export default function CollectionPoints() {
  const [q, setQ] = useState("");
  const points = useApi(() => api.collectionPoints(), []);

  const filtered = (points.data ?? []).filter(
    (p) => !q.trim() || p.localisation.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Points de collecte (UC-15)</h1>
      <Input placeholder="Rechercher par localité…" value={q} onChange={(e) => setQ(e.target.value)} />
      {points.loading ? (
        <Skeleton className="h-40" />
      ) : filtered.length === 0 ? (
        <EmptyState message="Aucun point de collecte trouvé." />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <div className="font-semibold text-slate-800">{p.nom}</div>
                  <div className="text-sm text-slate-500">{p.localisation}</div>
                  <div className="mt-1 text-xs text-slate-400">🕒 {p.horaires}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
