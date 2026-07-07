// Home.tsx — Écran principal Donneur "Command Center"
// Inspiré de HomeScreen() maquette.html ligne 804–875 · logique inchangée
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Crown, Droplet, HeartPulse, Lock, Medal, QrCode, Trophy } from "lucide-react";
import { api, type BadgeStatus, type DonorStats, type LeaderboardEntry } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { CountUp, GroupBadge, Skeleton } from "../../components/ui";

/* ─── Level Card ──────────────────────────────────────────────── */
const LEVEL_COLOR = ["#64748b","#b45309","#94a3b8","#eab308","#0891b2","#a855f7"];

function LevelCard({ s }: { s: DonorStats }) {
  const color = LEVEL_COLOR[s.niveau_index] ?? "#64748b";
  const pct   = Math.round(s.progression * 100);
  const next  = ["Nouveau","Bronze","Argent","Or","Platine","Diamant"][s.niveau_index + 1];

  return (
    <div
      className="card-in relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
        border: `1px solid ${color}40`,
        borderRadius: 12,
        padding: 18,
        boxShadow: `0 4px 16px ${color}20`,
      }}
    >
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Medal size={24} style={{ color }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
            Votre niveau
          </div>
          <div className="syne font-extrabold text-xl" style={{ color: "var(--txt)" }}>
            {s.niveau}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="syne font-extrabold text-2xl tabular-nums" style={{ color }}>
            <CountUp value={s.points} duration={1400} />
          </div>
          <div className="mono text-[10px] uppercase" style={{ color: "var(--txt-mute)" }}>points</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
          <div
            className="h-full rounded-full progress-fill"
            style={{
              width: `${pct}%`,
              background: color,
              boxShadow: `0 0 8px ${color}`,
              "--target-width": `${pct}%`,
            } as React.CSSProperties}
          />
        </div>
        <div className="mt-1.5 flex justify-between mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
          <span>Rang #{s.rang} / {s.nb_donneurs}</span>
          <span>{next ? `${s.dons_avant_niveau_suivant} don(s) → ${next}` : "Niveau maximal 🏆"}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Urgency Card — style maquette HomeScreen ────────────────── */
function UrgencyCard({ s }: { s: DonorStats }) {
  if (s.eligible_maintenant) {
    return (
      <div
        className="card-in"
        style={{
          background: "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.04))",
          border: "1px solid rgba(22,163,74,0.35)",
          borderRadius: 12,
          padding: 18,
          boxShadow: "0 0 0 1px rgba(22,163,74,0.15), 0 0 16px rgba(22,163,74,0.10)",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.35)" }}>
            <HeartPulse size={20} style={{ color: "var(--ok)" }} />
          </span>
          <div className="flex-1">
            <div className="syne font-bold" style={{ color: "var(--txt)" }}>Vous pouvez donner votre sang !</div>
            <p className="mono text-[11px] mt-0.5" style={{ color: "var(--txt-dim)" }}>
              Éligible maintenant. Un don peut sauver jusqu'à 3 vies.
            </p>
            <Link
              to="/donor/appointments"
              className="btn-blood inline-flex items-center gap-2 px-4 py-2 mt-3 text-sm"
            >
              <Calendar size={15} /> Prendre rendez-vous
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Card urgence nationale style maquette
  const jours = s.jours_avant_eligibilite ?? 0;
  const maxJ  = 56;
  const pct   = Math.round(Math.max(0, Math.min(100, ((maxJ - jours) / maxJ) * 100)));

  return (
    <div
      className="card-in glow-blood-strong"
      style={{
        background: "linear-gradient(135deg, rgba(230,57,70,0.18), rgba(230,57,70,0.04))",
        border: "1px solid rgba(230,57,70,0.45)",
        borderRadius: 12,
        padding: 18,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          {/* Label DM Mono style maquette */}
          <div className="mono text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--blood)" }}>
            <span className="pulse-soft">⚠</span> Niveau d'urgence national
          </div>
          <div className="syne font-extrabold text-2xl mt-1" style={{ color: "var(--txt)" }}>
            O− · <span className="pulse-text" style={{ color: "var(--blood)" }}>CRITIQUE</span>
          </div>
        </div>
        <div className="text-right mono">
          <div className="syne font-extrabold text-3xl" style={{ color: "var(--blood)" }}>12%</div>
          <div className="mono text-[9px] uppercase" style={{ color: "var(--txt-mute)" }}>capacité</div>
        </div>
      </div>

      {/* Barre de capacité */}
      <div className="h-2 mt-3 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="h-full rounded-full pulse-soft" style={{ width: "12%", background: "var(--blood)", boxShadow: "0 0 12px var(--blood)" }} />
      </div>
      <div className="mono text-[10px] mt-2" style={{ color: "var(--txt-dim)" }}>
        Le Sénégal a besoin de toi · 8 vies en attente
      </div>

      {/* Countdown prochain don */}
      {jours > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(230,57,70,0.20)" }}>
          <div className="flex items-end gap-2">
            <span className="syne font-extrabold text-4xl tabular-nums" style={{ color: "var(--txt)" }}>
              <CountUp value={jours} duration={1000} />
            </span>
            <span className="syne font-semibold text-base mb-1.5" style={{ color: "var(--txt-dim)" }}>jours avant votre prochain don</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full mt-2" style={{ background: "var(--line)" }}>
            <div
              className="h-full rounded-full progress-fill"
              style={{
                width: `${pct}%`,
                background: "var(--blood)",
                "--target-width": `${pct}%`,
              } as React.CSSProperties}
            />
          </div>
          {s.prochain_don_eligible && (
            <p className="mono text-[10px] mt-1" style={{ color: "var(--txt-mute)" }}>
              Éligible le {new Date(s.prochain_don_eligible).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Stats 3 colonnes style maquette ────────────────────────── */
function StatsRow({ s }: { s: DonorStats }) {
  const items = [
    { v: s.nb_dons,            l: "Dons",   icon: Droplet     },
    { v: s.vies_potentielles,  l: "Vies",   icon: HeartPulse  },
    { v: s.rang,               l: "Rang",   icon: Trophy, prefix: "#" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ v, l, icon: Icon, prefix }, i) => (
        <div
          key={l}
          className="card-in surface text-center py-3"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <Icon size={14} className="mx-auto mb-1" style={{ color: "var(--blood)" }} />
          <div className="syne font-bold text-xl" style={{ color: "var(--txt)" }}>
            {prefix}{typeof v === "number" ? <CountUp value={v} duration={1200} delay={i * 80} /> : v}
          </div>
          <div className="mono text-[9px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Badges style maquette ProfileScreen ─────────────────────── */
function BadgesGrid({ badges }: { badges: BadgeStatus[] }) {
  return (
    <div className="surface" style={{ padding: 18 }}>
      <div className="mono text-[10px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--txt-mute)" }}>
        Badges Gamification
      </div>
      <div className="grid grid-cols-3 gap-2">
        {badges.map((b, i) => (
          <div
            key={b.code}
            title={b.description}
            className={`card-in surface text-center p-3 transition-all ${b.obtenu ? "" : "opacity-40"}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-1.5"
              style={{
                background: b.obtenu ? "rgba(230,57,70,0.12)" : "var(--surface-2)",
                border: b.obtenu ? "1px solid rgba(230,57,70,0.35)" : "1px solid var(--line)",
              }}
            >
              {b.obtenu
                ? <Medal size={18} style={{ color: "var(--blood)" }} />
                : <Lock size={16} style={{ color: "var(--txt-mute)" }} />
              }
            </div>
            <div className="syne text-[10px] font-semibold leading-tight" style={{ color: "var(--txt)" }}>
              {b.label}
            </div>
            <div className="mono text-[8px] mt-0.5" style={{ color: "var(--txt-mute)" }}>{b.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Leaderboard style maquette ──────────────────────────────── */
const RANK_COLOR: Record<number, string> = { 1: "#eab308", 2: "#94a3b8", 3: "#b45309" };

function Leaderboard({ rows }: { rows: LeaderboardEntry[] }) {
  return (
    <div className="surface" style={{ padding: 18 }}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={14} style={{ color: "var(--blood)" }} />
        <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
          Classement des donneurs
        </div>
      </div>
      <ul className="space-y-2">
        {rows.map((e) => (
          <li
            key={e.rang}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
            style={{
              background: e.is_me ? "rgba(230,57,70,0.08)" : "transparent",
              border: e.is_me ? "1px solid rgba(230,57,70,0.20)" : "1px solid transparent",
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mono text-xs font-black"
              style={{
                background: RANK_COLOR[e.rang] ? `${RANK_COLOR[e.rang]}22` : "var(--surface-2)",
                color: RANK_COLOR[e.rang] ?? "var(--txt-mute)",
              }}
            >
              {e.rang <= 3 ? <Crown size={14} /> : e.rang}
            </span>
            <span className="min-w-0 flex-1 truncate syne font-semibold text-sm" style={{ color: "var(--txt)" }}>
              {e.nom_affiche}
              {e.is_me && <span className="ml-1.5 mono text-[10px]" style={{ color: "var(--blood)" }}>(vous)</span>}
            </span>
            <GroupBadge groupe={e.groupe_sanguin} />
            <span className="mono text-sm font-bold tabular-nums w-14 text-right" style={{ color: "var(--txt-dim)" }}>
              {e.nb_dons} <span className="font-normal" style={{ color: "var(--txt-mute)" }}>dons</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Home Page ───────────────────────────────────────────────── */
export default function Home() {
  const stats = useApi(() => api.donorStats(),  []);
  const board = useApi(() => api.leaderboard(), []);

  return (
    <div className="space-y-4">
      {stats.loading || !stats.data ? (
        <>
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </>
      ) : (
        <>
          <LevelCard s={stats.data} />
          <UrgencyCard s={stats.data} />
          <StatsRow s={stats.data} />
          <BadgesGrid badges={stats.data.badges} />
        </>
      )}

      {/* Prochain don & QR — style rows maquette */}
      {stats.data && (
        <>
          <Link
            to="/donor/appointments"
            className="card-in surface flex items-center gap-3 px-4 py-3 transition-all"
            style={{ textDecoration: "none" }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                 style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.30)" }}>
              <Calendar size={18} style={{ color: "var(--blood)" }} />
            </div>
            <div className="flex-1">
              <div className="syne font-semibold text-sm" style={{ color: "var(--txt)" }}>Prochain don possible</div>
              <div className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
                {stats.data.prochain_don_eligible
                  ? `${new Date(stats.data.prochain_don_eligible).toLocaleDateString("fr-FR")} · J−${stats.data.jours_avant_eligibilite}`
                  : "Éligible maintenant"}
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--txt-mute)" }} />
          </Link>

          <Link
            to="/donor/profile"
            className="card-in surface-2 flex items-center gap-3 px-4 py-3 transition-all"
            style={{ textDecoration: "none" }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--bg)" }}>
              <QrCode size={18} style={{ color: "var(--txt-mute)" }} />
            </div>
            <div className="flex-1">
              <div className="syne font-semibold text-sm" style={{ color: "var(--txt)" }}>Mon QR Donneur</div>
              <div className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>Présenter à l'accueil</div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--txt-mute)" }} />
          </Link>
        </>
      )}

      {/* Leaderboard */}
      {board.loading || !board.data
        ? <Skeleton className="h-40 rounded-xl" />
        : <Leaderboard rows={board.data} />}
    </div>
  );
}
