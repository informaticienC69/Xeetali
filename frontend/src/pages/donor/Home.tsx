import { Link } from "react-router-dom";
import { Award, Calendar, ChevronRight, Crown, Droplet, HeartPulse, Lock, Medal, Trophy } from "lucide-react";
import { api, type BadgeStatus, type DonorStats, type LeaderboardEntry } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { GroupBadge, Skeleton } from "../../components/ui";

const LEVELS = ["Nouveau donneur", "Bronze", "Argent", "Or", "Platine", "Diamant"];
const LEVEL_COLOR = ["#64748b", "#b45309", "#94a3b8", "#eab308", "#0891b2", "#a855f7"];

const CARD = "rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800";

function LevelCard({ s }: { s: DonorStats }) {
  const color = LEVEL_COLOR[s.niveau_index] ?? "#64748b";
  const next = LEVELS[s.niveau_index + 1];
  return (
    <div className={CARD}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${color}26`, color }}>
          <Medal size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-400 dark:text-slate-500">Votre niveau</div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{s.niveau}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">{s.points}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">points</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(s.progression * 100)}%`, background: color }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>Rang #{s.rang} / {s.nb_donneurs}</span>
          <span>{next ? `${s.dons_avant_niveau_suivant} don(s) → ${next}` : "Niveau maximal 🏆"}</span>
        </div>
      </div>
    </div>
  );
}

function NextDonationCard({ s }: { s: DonorStats }) {
  if (s.eligible_maintenant) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/40">
        <div className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-300">
          <HeartPulse size={20} /> Vous pouvez donner votre sang !
        </div>
        <p className="mt-1 text-sm text-green-700 dark:text-green-400">Vous êtes éligible. Un don peut sauver jusqu'à 3 vies.</p>
        <Link to="/donor/appointments" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
          <Calendar size={16} /> Prendre rendez-vous
        </Link>
      </div>
    );
  }
  return (
    <div className={CARD}>
      <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
        <Calendar size={20} className="text-red-500" /> Prochain don
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Éligible dans <b className="text-slate-700 dark:text-slate-200">{s.jours_avant_eligibilite} jours</b>
        {s.prochain_don_eligible ? ` (${new Date(s.prochain_don_eligible).toLocaleDateString("fr-FR")})` : ""}.
      </p>
    </div>
  );
}

function ImpactRow({ s }: { s: DonorStats }) {
  const items = [
    { icon: Droplet, label: "Dons", value: s.nb_dons, tint: "#dc2626" },
    { icon: HeartPulse, label: "Vies aidées", value: s.vies_potentielles, tint: "#0ca30c" },
    { icon: Award, label: "Volume (cl)", value: Math.round(s.total_volume_ml / 10), tint: "#2a78d6" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ icon: Icon, label, value, tint }) => (
        <div key={label} className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-800">
          <span className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${tint}26`, color: tint }}>
            <Icon size={18} />
          </span>
          <div className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">{value}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">{label}</div>
        </div>
      ))}
    </div>
  );
}

function BadgesGrid({ badges }: { badges: BadgeStatus[] }) {
  return (
    <div className={CARD}>
      <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Mes badges</h2>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((b) => (
          <div
            key={b.code}
            title={b.description}
            className={"flex flex-col items-center gap-1 rounded-xl border p-3 text-center " + (b.obtenu ? "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30" : "border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900")}
          >
            <span className={"flex h-10 w-10 items-center justify-center rounded-full " + (b.obtenu ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300" : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500")}>
              {b.obtenu ? <Medal size={20} /> : <Lock size={16} />}
            </span>
            <span className={"text-[11px] font-medium leading-tight " + (b.obtenu ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500")}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const RANK_COLOR: Record<number, string> = { 1: "#eab308", 2: "#94a3b8", 3: "#b45309" };

function Leaderboard({ rows }: { rows: LeaderboardEntry[] }) {
  return (
    <div className={CARD}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <Trophy size={16} className="text-amber-500" /> Classement des donneurs
      </h2>
      <ul className="space-y-1.5">
        {rows.map((e) => (
          <li key={e.rang} className={"flex items-center gap-3 rounded-xl px-3 py-2 " + (e.is_me ? "bg-red-50 ring-1 ring-red-200 dark:bg-red-950/40 dark:ring-red-900" : "")}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: `${RANK_COLOR[e.rang] ?? "#94a3b8"}33`, color: RANK_COLOR[e.rang] ?? "#94a3b8" }}>
              {e.rang <= 3 ? <Crown size={14} /> : e.rang}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {e.nom_affiche} {e.is_me && <span className="text-red-600 dark:text-red-400">(vous)</span>}
            </span>
            <GroupBadge groupe={e.groupe_sanguin} />
            <span className="w-14 text-right text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300">{e.nb_dons} dons</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const stats = useApi(() => api.donorStats(), []);
  const board = useApi(() => api.leaderboard(), []);

  return (
    <div className="space-y-4">
      {stats.loading || !stats.data ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : (
        <>
          <LevelCard s={stats.data} />
          <NextDonationCard s={stats.data} />
          <ImpactRow s={stats.data} />
          <BadgesGrid badges={stats.data.badges} />
        </>
      )}

      <Link to="/donor/points" className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm shadow-sm dark:bg-slate-800">
        <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
          <Droplet size={18} className="text-red-500" /> Trouver un centre de collecte
        </span>
        <ChevronRight size={18} className="text-slate-400 dark:text-slate-500" />
      </Link>

      {board.loading || !board.data ? <Skeleton className="h-40 rounded-2xl" /> : <Leaderboard rows={board.data} />}
    </div>
  );
}
