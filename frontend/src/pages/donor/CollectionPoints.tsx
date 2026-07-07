// CollectionPoints.tsx — Donor · Command Center
import { useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { EmptyState, Input, Skeleton, PageHeader } from "../../components/ui";

export default function CollectionPoints() {
  const [q, setQ] = useState("");
  const points = useApi(() => api.collectionPoints(), []);
  const filtered = (points.data ?? []).filter(
    (p) => !q.trim() || p.localisation.toLowerCase().includes(q.trim().toLowerCase()) ||
           p.nom.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Points de collecte"
        subtitle="Réseau collecte"
        icon={MapPin}
      />

      <Input placeholder="Rechercher par nom ou localité…" value={q} onChange={(e) => setQ(e.target.value)} />

      {points.loading ? (
        <>
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </>
      ) : filtered.length === 0 ? (
        <EmptyState message="Aucun point de collecte trouvé." />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card-in surface flex items-start gap-3 px-4 py-3"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(230,57,70,0.10)", border: "1px solid rgba(230,57,70,0.25)" }}
              >
                <MapPin size={18} style={{ color: "var(--blood)" }} />
              </div>
              <div>
                <div className="syne font-semibold text-sm" style={{ color: "var(--txt)" }}>{p.nom}</div>
                <div className="mono text-[11px] mt-0.5" style={{ color: "var(--txt-dim)" }}>{p.localisation}</div>
                <div className="flex items-center gap-1 mono text-[10px] mt-1" style={{ color: "var(--txt-mute)" }}>
                  <Clock size={11} /> {p.horaires}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
