// History.tsx — Donor · Timeline Command Center
import { Droplet, HeartPulse } from "lucide-react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { EmptyState, GroupBadge, Skeleton, PageHeader } from "../../components/ui";

export default function History() {
  const donations = useApi(() => api.myDonations(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mes dons"
        subtitle="Chronologie"
        icon={HeartPulse}
      />

      {donations.loading ? (
        <>
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </>
      ) : !donations.data?.length ? (
        <div className="surface rounded-xl py-12 text-center">
          <Droplet size={32} className="mx-auto mb-3" style={{ color: "var(--txt-mute)", opacity: 0.4 }} />
          <EmptyState message="Aucun don enregistré pour l'instant." />
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-2 bottom-2 w-px" style={{ background: "var(--line)" }} />

          <ul className="space-y-3">
            {donations.data.map((d, i) => (
              <li
                key={d.id}
                className="card-in relative flex items-center gap-4 rounded-xl px-4 py-3"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  animationDelay: `${i * 60}ms`,
                  marginLeft: 0,
                }}
              >
                {/* Timeline dot */}
                <div
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl z-10"
                  style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.35)" }}
                >
                  <Droplet size={18} style={{ color: "var(--blood)" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="syne font-semibold text-sm" style={{ color: "var(--txt)" }}>
                      {new Date(d.date).toLocaleDateString("fr-FR", {
                        weekday: "long", day: "2-digit", month: "long", year: "numeric"
                      })}
                    </div>
                    <GroupBadge groupe={d.groupe_sanguin} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 mono text-[11px]" style={{ color: "var(--txt-mute)" }}>
                    <span>{d.volume} ml</span>
                    <span>·</span>
                    <span style={{ color: "var(--ok)" }}>~3 vies potentielles</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
