// History.tsx — Donor
import { Droplet, HeartPulse } from "lucide-react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { EmptyState, GroupBadge, Skeleton, PageHeader } from "../../components/ui";

function GlobalImpact({ donations }: { donations: any[] }) {
  const totalVolume = donations.reduce((acc, d) => acc + d.volume, 0);
  const livesSaved = donations.length * 3;

  const lastDonation = donations[0];
  const nextEligible = lastDonation
    ? new Date(new Date(lastDonation.date).getTime() + 56 * 86400000)
    : null;
  const daysLeft = nextEligible
    ? Math.max(0, Math.ceil((nextEligible.getTime() - Date.now()) / 86400000))
    : null;
  const eligible = daysLeft === 0 || daysLeft === null;

  return (
    <div
      className="w-full rounded-[24px] mb-6 p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-5">
        <HeartPulse size={14} style={{ color: "var(--blood)" }} />
        <span className="mono text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: "var(--txt-mute)" }}>
          Impact de vos dons
        </span>
      </div>

      {/* Two-column body */}
      <div className="flex items-stretch gap-4">

        {/* LEFT — Hero number on subtle tinted background */}
        <div
          className="flex flex-col justify-center items-center rounded-2xl px-5 py-5 shrink-0"
          style={{
            background: "color-mix(in srgb, var(--blood) 6%, var(--surface))",
            border: "1px solid color-mix(in srgb, var(--blood) 15%, var(--line))",
            minWidth: "90px"
          }}
        >
          <span className="syne font-extrabold" style={{ fontSize: "44px", color: "var(--txt)", lineHeight: 1 }}>
            {livesSaved}
          </span>
          <span className="mono text-[9px] mt-2 text-center uppercase tracking-widest" style={{ color: "var(--blood)" }}>
            vies
          </span>
        </div>

        {/* RIGHT — Context */}
        <div className="flex flex-col justify-between flex-1 gap-2.5">

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
              <p className="mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--txt-mute)" }}>Dons</p>
              <p className="syne font-bold text-lg leading-none" style={{ color: "var(--txt)" }}>{donations.length}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
              <p className="mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--txt-mute)" }}>Volume</p>
              <p className="syne font-bold text-lg leading-none" style={{ color: "var(--txt)" }}>
                {(totalVolume / 1000).toFixed(1)}
                <span className="text-sm font-normal" style={{ color: "var(--txt-mute)" }}>L</span>
              </p>
            </div>
          </div>

          {/* Eligibility badge */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{
              background: eligible ? "color-mix(in srgb, var(--ok) 8%, var(--surface))" : "var(--bg-2)",
              border: `1px solid ${eligible ? "color-mix(in srgb, var(--ok) 30%, transparent)" : "var(--line)"}`
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: eligible ? "var(--ok)" : "var(--txt-mute)",
                boxShadow: eligible ? "0 0 6px var(--ok)" : "none"
              }}
            />
            <span className="mono text-[10px] font-semibold" style={{ color: eligible ? "var(--ok)" : "var(--txt-dim)" }}>
              {eligible ? "Don possible aujourd'hui" : `Prochain don dans ${daysLeft} j`}
            </span>
            {!eligible && daysLeft !== null && (
              <div className="ml-auto w-14 h-1 rounded-full overflow-hidden shrink-0" style={{ background: "var(--line)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round(((56 - daysLeft) / 56) * 100)}%`, background: "var(--blood)" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const donations = useApi(() => api.myDonations(), []);

  return (
    <div className="space-y-4 pb-10">
      <PageHeader
        title="Mes dons"
        subtitle="Chronologie"
        icon={HeartPulse}
      />

      {donations.loading ? (
        <>
          <Skeleton className="h-36 rounded-3xl mb-6" />
          <Skeleton className="h-24 rounded-3xl mb-4" />
          <Skeleton className="h-24 rounded-3xl" />
        </>
      ) : !donations.data?.length ? (
        <div className="surface rounded-2xl py-12 text-center" style={{ border: "1px solid var(--line)", background: "var(--surface)" }}>
          <Droplet size={32} className="mx-auto mb-3" style={{ color: "var(--txt-mute)", opacity: 0.4 }} />
          <EmptyState message="Aucun don enregistré pour l'instant." />
        </div>
      ) : (
        <div className="relative">
          <GlobalImpact donations={donations.data} />

          <div className="mono text-[10px] uppercase tracking-widest mb-6 ml-4" style={{ color: "var(--txt-mute)" }}>Journal de bord</div>

          <div className="relative pl-6">
            {/* SVG Glowing Timeline */}
            <div className="absolute left-[38px] top-6 bottom-4 w-[2px] overflow-hidden" style={{ background: "color-mix(in srgb, var(--line) 50%, transparent)" }}>
              <div className="w-full h-full bg-linear-to-b from-(--blood) via-(--blood) to-transparent" style={{ animation: "slideDown 2s ease-out forwards", filter: "drop-shadow(0 0 8px var(--blood))" }} />
            </div>

            <ul className="space-y-8">
              {donations.data.map((d, i) => (
                <li
                  key={d.id}
                  className="card-in relative flex items-start gap-5"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Timeline pill */}
                  <div
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] z-10 mt-1 shadow-lg transition-transform duration-500 hover:scale-[1.15] cursor-default"
                    style={{
                      background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)",
                      border: "1px solid var(--line)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.05)"
                    }}
                  >
                    <div className="absolute inset-0 rounded-[18px] opacity-0 hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at center, var(--blood-glow) 0%, transparent 70%)" }} />
                    <Droplet size={18} style={{ color: "var(--blood)" }} className="relative z-10" />
                  </div>

                  {/* Card */}
                  <div
                    className="flex-1 min-w-0 rounded-[24px] p-5 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden"
                    style={{
                      background: "linear-gradient(145deg, var(--surface) 0%, var(--bg) 100%)",
                      border: "1px solid var(--line)",
                      boxShadow: "var(--shadow-md)",
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "radial-gradient(circle at top right, rgba(230,57,70,0.08) 0%, transparent 60%)" }} />

                    <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                      <div className="syne font-bold text-[15px] tracking-wide" style={{ color: "var(--txt)" }}>
                        {new Date(d.date).toLocaleDateString("fr-FR", {
                          weekday: "long", day: "2-digit", month: "long", year: "numeric"
                        })}
                      </div>
                      <div className="scale-110 origin-right"><GroupBadge groupe={d.groupe_sanguin} /></div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 relative z-10">
                      <div className="flex flex-col">
                        <span className="mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--txt-mute)" }}>Volume Donné</span>
                        <span className="mono font-bold text-sm" style={{ color: "var(--txt)" }}>{d.volume} mL</span>
                      </div>
                      <div className="w-px h-8" style={{ background: "var(--line)" }} />
                      <div className="flex flex-col">
                        <span className="mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--txt-mute)" }}>Impact Estimé</span>
                        <span className="syne font-bold text-sm" style={{ color: "var(--blood)" }}>~3 vies touchées</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
