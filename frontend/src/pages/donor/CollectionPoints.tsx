// CollectionPoints.tsx — Donor · UX Masterpiece
import { useState } from "react";
import { Clock, MapPin, Search } from "lucide-react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { EmptyState, Skeleton, PageHeader } from "../../components/ui";

export default function CollectionPoints() {
  const [q, setQ] = useState("");
  const points = useApi(() => api.collectionPoints(), []);
  const filtered = (points.data ?? []).filter(
    (p) => !q.trim() || p.localisation.toLowerCase().includes(q.trim().toLowerCase()) ||
           p.nom.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Centres"
        subtitle="Réseau national"
        icon={MapPin}
      />

      <div className="relative group mt-4 mb-8">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search size={20} style={{ color: "var(--txt-mute)" }} className="transition-colors group-focus-within:text-(--blood)" />
        </div>
        <input 
          placeholder="Rechercher une localité, un hôpital..." 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          className="w-full h-16 pl-14 pr-6 rounded-[24px] text-lg transition-all duration-300 focus:outline-none"
          style={{ 
            background: "linear-gradient(145deg, var(--surface) 0%, var(--bg) 100%)", 
            border: "2px solid var(--line)",
            color: "var(--txt)",
            boxShadow: "var(--shadow-sm)"
          }}
        />
        <div className="absolute inset-0 rounded-[24px] pointer-events-none transition-all duration-300 group-focus-within:border-(--blood)" style={{ border: "2px solid transparent" }} />
      </div>

      {points.loading ? (
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-48 rounded-[32px]" />
          <Skeleton className="h-48 rounded-[32px]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12">
          <EmptyState message="Aucun centre trouvé dans cette zone." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="card-in relative overflow-hidden flex flex-col justify-between p-6 rounded-[32px] transition-all duration-500 group"
              style={{ 
                background: "linear-gradient(145deg, var(--surface) 0%, var(--bg-2) 100%)",
                border: "1px solid var(--line)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                animationDelay: `${Math.min(i * 50, 400)}ms`,
                minHeight: "220px"
              }}
            >
              {/* Giant Watermark */}
              <MapPin className="absolute -right-8 -bottom-8 w-56 h-56 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12" style={{ color: "var(--txt)" }} />
              
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "radial-gradient(circle at top right, var(--blood-glow) 0%, transparent 70%)" }} />
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] shadow-xl transition-transform duration-500 group-hover:scale-110"
                     style={{ background: "linear-gradient(135deg, var(--blood) 0%, var(--blood-dim) 100%)" }}>
                  <MapPin size={28} className="text-white drop-shadow-md" />
                </div>
                
                <div className="mono text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-full uppercase font-bold" style={{ background: "color-mix(in srgb, var(--surface-2) 80%, transparent)", color: "var(--txt)", border: "1px solid var(--line)" }}>
                  Centre Agréé
                </div>
              </div>
              
              <div className="relative z-10 mt-6">
                <h3 className="font-bold text-2xl tracking-wide mb-1" style={{ color: "var(--txt)" }}>{p.nom}</h3>
                <p className="mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--txt-mute)" }}>{p.localisation}</p>
                
                <div className="flex items-center gap-2 mono text-sm font-bold w-fit px-4 py-2 rounded-xl backdrop-blur-sm" style={{ color: "var(--blood)", background: "color-mix(in srgb, var(--surface-2) 50%, transparent)", border: "1px solid var(--line)" }}>
                  <Clock size={16} /> {p.horaires}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
