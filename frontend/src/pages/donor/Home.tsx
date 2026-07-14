// Home.tsx — Interface Donneur "Hors Norme" · Xéétali v2
// Refonte complète : Glassmorphism · Holographic · Gamification · Urgence Émotionnelle
import { Link } from "react-router-dom";
import {
  Calendar, ChevronRight, Crown, Droplet, Flame, Heart,
  HeartPulse, Lock, Medal, QrCode, Star, Trophy, Zap,
  Globe2, Gem, Activity, Share2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, type BadgeStatus, type DonorStats, type LeaderboardEntry } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { CountUp, GroupBadge, Skeleton, Modal } from "../../components/ui";
import QRCode from "react-qr-code";

/* ─── Constantes ─────────────────────────────────────────────── */
const LEVEL_COLORS = ["#64748b", "#b45309", "#94a3b8", "#eab308", "#0891b2", "#a855f7"];
const LEVEL_NAMES  = ["Nouveau", "Bronze", "Argent", "Or", "Platine", "Diamant"];
const BADGE_ICONS: Record<string, React.ElementType> = {
  premier_don: Droplet, fidele: Flame, veteran: Trophy,
  marathon: Zap, sauveur: Gem, legendaire: Crown,
};

/* ─── Helpers ────────────────────────────────────────────────── */
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 48%)`;
}



/* ─── HeroCard ───────────────────────────────────────────────── */
function HeroCard({ s }: { s: DonorStats }) {
  const color  = LEVEL_COLORS[s.niveau_index] ?? "#64748b";
  const pct    = Math.round(s.progression * 100);
  const next   = LEVEL_NAMES[s.niveau_index + 1];
  const streak = s.streak_annees;

  const handleShare = async () => {
    const shareText = `Je suis un donneur de niveau ${s.niveau} avec ${s.points} XP sur XEETALI ! Rejoignez-moi pour sauver des vies.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon profil Donneur - XEETALI',
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText + " " + window.location.origin);
      alert("Lien copié dans le presse-papier !");
    }
  };

  return (
    <div className="perspective-container card-in" style={{ animationDelay: "0ms" }}>
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: "var(--radius)",
          padding: "22px 20px",
          background: "var(--surface)",
          border: `1px solid ${color}33`,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Header : niveau + points */}
        <div className="relative flex items-start gap-4">
          {/* Icône niveau */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: `${color}1a`,
              border: `1px solid ${color}44`,
            }}
          >
            <Medal size={26} style={{ color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
              Votre niveau
            </div>
            <div
              className="font-extrabold text-2xl neon-blood-text"
              style={{ color: "var(--txt)", lineHeight: 1.1 }}
            >
              {s.niveau}
            </div>
            <div className="mono text-[10px] mt-0.5" style={{ color: "var(--txt-dim)" }}>
              Rang #{s.rang} sur {s.nb_donneurs} donneurs
            </div>
          </div>

          {/* Points */}
          <div className="text-right shrink-0">
            <div
              className="font-extrabold text-3xl tabular-nums neon-gold-text"
              style={{ color }}
            >
              <CountUp value={s.points} duration={1600} />
            </div>
            <div className="mono text-[9px] uppercase tracking-wider mb-2" style={{ color: "var(--txt-mute)" }}>
              points xp
            </div>
            <button onClick={handleShare} className="flex items-center gap-1.5 ml-auto text-[10px] uppercase font-bold mono tracking-widest px-2 py-1 rounded-lg transition-all hover:bg-white/5 cursor-pointer active:scale-95" style={{ color: "var(--txt-dim)", border: "1px solid var(--line)" }}>
              <Share2 size={12} /> Partager
            </button>
          </div>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div
            className="relative mt-4 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: "var(--warn-tint)",
              border: "1px solid transparent",
            }}
          >
            <Flame size={14} style={{ color: "var(--warn)" }} />
            <span className="font-bold text-sm" style={{ color: "var(--txt)" }}>
              {streak} {streak === 1 ? "an" : "ans"} de suite
            </span>
            <span className="mono text-[10px] flex items-center gap-1" style={{ color: "var(--txt-mute)" }}>· Série active <Flame size={10} style={{ color: "#f97316" }} /></span>
            <div className="ml-auto h-1.5 w-16 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div className="streak-bar h-full rounded-full" style={{ width: `${Math.min(streak * 14, 100)}%` }} />
            </div>
          </div>
        )}

        {/* Progress bar niveau */}
        <div className="relative mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
            <div
              className="h-full rounded-full progress-fill"
              style={{
                width: `${pct}%`,
                background: color,
                "--target-width": `${pct}%`,
              } as React.CSSProperties}
            />
          </div>
          <div className="mt-1.5 flex justify-between mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
            <span>{pct}% vers le prochain niveau</span>
            <span className="flex items-center gap-1">{next ? `${s.dons_avant_niveau_suivant} don(s) → ${next}` : <><Trophy size={10} style={{ color: "var(--blood)" }} /> Niveau maximal !</>}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PulseAction ────────────────────────────────────────────── */
function PulseAction({ s }: { s: DonorStats }) {
  const jours = s.jours_avant_eligibilite ?? 0;
  const maxJ  = 56;
  const pct   = Math.round(Math.max(0, Math.min(100, ((maxJ - jours) / maxJ) * 100)));

  if (s.eligible_maintenant) {
    return (
      <div
        className="card-in relative overflow-hidden"
        style={{
          borderRadius: "var(--radius)",
          padding: "24px 20px",
          background: "var(--blood-tint)",
          border: "1px solid color-mix(in srgb, var(--blood) 28%, transparent)",
          boxShadow: "var(--shadow-sm)",
          animationDelay: "80ms",
        }}
      >
        {/* Badge "Éligible" */}
        <div className="relative flex items-center gap-2 mb-4">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: "var(--blood-tint)", border: "1px solid color-mix(in srgb, var(--blood) 35%, transparent)" }}
          >
            <Zap size={11} style={{ color: "var(--blood-dim)" }} />
            <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--blood-dim)" }}>
              Don possible
            </span>
          </div>
        </div>

        <div className="relative">
          <p className="font-bold text-xl leading-tight" style={{ color: "var(--txt)", letterSpacing: "-0.01em" }}>
            Le Sénégal a besoin<br />
            <span style={{ color: "var(--blood-dim)" }}>de vous aujourd'hui</span>
          </p>
          <p className="text-[12px] mt-2" style={{ color: "var(--txt-dim)" }}>
            Un don de votre sang peut sauver jusqu'à 3 vies. Vous êtes éligible maintenant.
          </p>
        </div>

        {/* CTA principal */}
        <div className="relative mt-5 flex justify-center">
          <Link
            to="/donor/appointments"
            className="btn-blood relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 w-full"
            style={{ borderRadius: "var(--radius-sm)", fontSize: 15 }}
          >
            <Heart size={18} fill="white" />
            Prendre rendez-vous
          </Link>
        </div>
      </div>
    );
  }

  /* Mode attente — Status Ring */
  const joursEcoules = maxJ - jours;
  let phaseRecup = "";
  let phaseColor = "";
  if (joursEcoules < 3) {
    phaseRecup = "Reconstitution du volume sanguin";
    phaseColor = "#0891b2";
  } else if (joursEcoules < 21) {
    phaseRecup = "Renouvellement des globules rouges";
    phaseColor = "#eab308";
  } else {
    phaseRecup = "Reconstitution du fer";
    phaseColor = "#16a34a";
  }

  return (
    <div
      className="card-in"
      style={{
        borderRadius: 20,
        padding: "20px",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        animationDelay: "80ms",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Status Ring SVG */}
        <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
          <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" stroke="var(--line)" />
            <circle
              cx="32" cy="32" r="28" fill="none" strokeWidth="4"
              stroke="var(--clinic)"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
              style={{ transition: "stroke-dashoffset 1.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-sm" style={{ color: "var(--clinic-dim)" }}>{pct}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
            Prochain don possible dans
          </div>
          <div className="font-extrabold text-3xl tabular-nums mt-0.5 mb-1" style={{ color: "var(--txt)" }}>
            <CountUp value={jours} duration={1200} />
            <span className="font-semibold text-base ml-1.5" style={{ color: "var(--txt-dim)" }}>jours</span>
          </div>
          
          {/* Phase de récupération (Coaching) */}
          <div className="flex items-center gap-1.5 mt-1 bg-white/5 w-fit px-2 py-0.5 rounded border border-white/5">
             <Activity size={10} style={{ color: phaseColor }} />
             <span className="mono text-[9px] uppercase tracking-wider" style={{ color: phaseColor }}>
               {phaseRecup}
             </span>
          </div>
        </div>
      </div>

      <Link
        to="/donor/appointments"
        className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors"
        style={{
          background: "var(--clinic-tint)",
          border: "1px solid transparent",
          textDecoration: "none",
        }}
      >
        <Calendar size={14} style={{ color: "var(--clinic)" }} />
        <span className="font-semibold text-sm flex-1" style={{ color: "var(--txt)" }}>
          Planifier mon prochain don
        </span>
        <ChevronRight size={14} style={{ color: "var(--txt-mute)" }} />
      </Link>
    </div>
  );
}


/* ─── NationalEmergencyBanner ────────────────────────────────── */
function NationalEmergencyBanner() {
  const urgency = useApi(() => api.urgencyStats(), []);

  if (urgency.loading || !urgency.data) return null;
  
  const { vies_en_attente, capacite_pct, groupe_critique, regions } = urgency.data;
  if (vies_en_attente === 0) return null;

  return (
    <div
      className="card-in relative overflow-hidden"
      style={{
        borderRadius: "var(--radius)",
        padding: "22px",
        background: "var(--crit-tint)",
        border: "1px solid color-mix(in srgb, var(--crit) 30%, transparent)",
        boxShadow: "var(--shadow-sm)",
        animationDelay: "120ms",
      }}
    >
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Icône urgence */}
        <div className="shrink-0 relative">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--crit)" }}>
            <Activity size={26} style={{ color: "#fff" }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 rounded-full" style={{ background: "var(--blood)", color: "#fff" }}>
              Urgence Nationale
            </span>
            <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
              {regions}
            </span>
          </div>
          
          <div className="font-extrabold text-xl leading-tight mt-1" style={{ color: "var(--txt)" }}>
            Pénurie critique de sang <span className="neon-blood-text" style={{ color: "var(--blood)" }}>{groupe_critique}</span>
          </div>
          
          <div className="mono text-[11px] mt-2" style={{ color: "var(--txt-dim)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--txt)" }}>{vies_en_attente} vies</strong> sont actuellement en danger. <br className="hidden sm:block" />
            Capacité des réserves : <strong style={{ color: "var(--blood)" }}>{capacite_pct}%</strong>.
          </div>
        </div>

        <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-col items-end shrink-0">
           {/* Progress bar representing capacity */}
          <div className="w-full sm:w-24 mb-1.5 flex justify-between mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
             <span>Stock</span>
             <span style={{ color: "var(--blood)" }}>{capacite_pct}%</span>
          </div>
          <div className="h-1.5 w-full sm:w-24 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${capacite_pct}%`, background: "var(--crit)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ImpactVisualizer ───────────────────────────────────────── */
function ImpactVisualizer({ s }: { s: DonorStats }) {
  const stats = [
    { v: s.nb_dons,           label: "Dons réalisés",   info: "Merci pour votre geste", icon: Droplet,    bgClass: "bg-red-50 dark:bg-red-500/15", textClass: "text-(--blood) dark:text-red-400" },
    { v: s.vies_potentielles, label: "Vies touchées",   info: "1 don ≈ 3 vies sauvées", icon: Heart,      bgClass: "bg-rose-50 dark:bg-rose-500/15", textClass: "text-rose-500 dark:text-rose-400" },
    { v: Math.round(s.total_volume_ml ?? s.nb_dons * 450), label: "Volume (mL)", info: "~450 mL par poche",    icon: HeartPulse, bgClass: "bg-violet-50 dark:bg-violet-500/15", textClass: "text-violet-500 dark:text-violet-400" },
  ];

  return (
    <div
      className="card-in relative overflow-hidden rounded-[24px] p-6 shadow-sm"
      style={{ 
        animationDelay: "160ms",
        background: "var(--surface)",
        border: "1px solid var(--line)"
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="mono text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--txt-mute)" }}>
          <Globe2 size={14} className="text-(--blood)" /> Votre Impact Réel
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {stats.map(({ v, label, info, icon: Icon, bgClass, textClass }, i) => (
          <div
            key={label}
            className="flex items-center gap-4 p-3.5 rounded-2xl transition-all hover:scale-[1.01]"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${bgClass} ${textClass}`}>
              <Icon size={22} strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold tracking-wide text-[14.5px]" style={{ color: "var(--txt)" }}>
                  {label}
                </span>
                <span className="text-[11px] mt-0.5" style={{ color: "var(--txt-mute)" }}>
                  {info}
                </span>
              </div>
              <div className="font-bold text-2xl tabular-nums tracking-tight" style={{ color: "var(--txt)" }}>
                <CountUp value={v} duration={1400} delay={i * 100} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── BadgeVault ─────────────────────────────────────────────── */
function BadgeVault({ badges }: { badges: BadgeStatus[] }) {
  const obtained = badges.filter((b) => b.obtenu).length;
  const pct = Math.round((obtained / badges.length) * 100) || 0;

  return (
    <div
      className="card-in relative overflow-hidden rounded-[24px] p-6 shadow-sm"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        animationDelay: "200ms"
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="mono text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--txt-mute)" }}>
          <Medal size={14} className="text-amber-500" /> Votre Arsenal
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-2)" }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: "var(--blood)" }} />
          </div>
          <div className="mono text-[10px] font-bold" style={{ color: "var(--txt-dim)" }}>
            {obtained}/{badges.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((b, i) => {
          const BadgeIcon = BADGE_ICONS[b.code] || Star;
          const isObtained = b.obtenu;
          
          return (
            <div
              key={b.code}
              title={isObtained ? b.description : `[Bloqué] ${b.description}`}
              className={`group relative flex flex-col items-center justify-center p-5 rounded-[20px] transition-all duration-300 ${
                isObtained ? "hover:scale-[1.02] hover:shadow-sm cursor-pointer" : ""
              }`}
              style={{
                background: isObtained ? "var(--surface-2)" : "var(--bg)",
                border: isObtained ? "1px solid var(--line)" : "1px dashed var(--line)",
                animationDelay: `${i * 60}ms`
              }}
            >
              <div
                className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-[16px] mb-3 transition-transform duration-300 ${
                  isObtained 
                    ? "bg-red-50 dark:bg-red-500/15 text-(--blood) dark:text-red-400 group-hover:-translate-y-1" 
                    : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500"
                }`}
              >
                {isObtained ? (
                  <BadgeIcon size={24} strokeWidth={2.5} />
                ) : (
                  <Lock size={18} strokeWidth={2} />
                )}
              </div>

              <div className={`tracking-wide text-[13px] leading-tight text-center z-10 ${isObtained ? 'font-semibold' : 'font-medium'}`} style={{ color: isObtained ? "var(--txt)" : "var(--txt-mute)" }}>
                {b.label}
              </div>
              
              {!isObtained && b.seuil > 0 && (
                <div className="text-[11px] mt-1.5 font-medium" style={{ color: "var(--txt-dim)" }}>
                  {b.seuil} dons
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── EpicLeaderboard ────────────────────────────────────────── */
const RANK_BG_LIGHT: Record<number, string> = { 1: "bg-amber-50 dark:bg-amber-500/15", 2: "bg-slate-100 dark:bg-slate-500/20", 3: "bg-orange-50 dark:bg-orange-500/15" };
const RANK_TEXT: Record<number, string> = { 1: "text-amber-500", 2: "text-slate-500 dark:text-slate-400", 3: "text-orange-600 dark:text-orange-400" };

function EpicLeaderboard({ rows }: { rows: LeaderboardEntry[] }) {
  return (
    <div
      className="card-in relative overflow-hidden rounded-[24px] p-6 shadow-sm"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        animationDelay: "240ms"
      }}
    >
      {/* Leaderboard header */}
      <div className="flex items-center gap-2 mb-6">
        <Trophy size={16} className="text-(--blood)" />
        <div className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--txt-mute)" }}>
          Classement des donneurs
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((e, i) => {
          const initials = e.nom_affiche.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const bgCol    = avatarColor(e.nom_affiche);
          const rankBg   = RANK_BG_LIGHT[e.rang] || "bg-slate-50 dark:bg-white/5";
          const rankTxt  = RANK_TEXT[e.rang] || "text-slate-400 dark:text-slate-500";

          return (
            <li
              key={e.rang}
              className={`row-fade-in flex items-center gap-4 rounded-[16px] px-4 py-3 transition-all hover:scale-[1.01]`}
              style={{
                animationDelay: `${i * 60}ms`,
                background: e.is_me ? "var(--surface-2)" : "transparent",
                border: e.is_me ? "1px solid var(--line)" : "1px solid transparent",
              }}
            >
              {/* Rank badge */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${rankBg} ${rankTxt}`}
              >
                {e.rang <= 3
                  ? <Crown size={20} strokeWidth={2.5} />
                  : <span className="font-bold text-[15px]">{e.rang}</span>}
              </div>

              {/* Avatar */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-[13px]"
                style={{ background: bgCol, color: "#fff" }}
              >
                {initials}
              </div>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="font-semibold text-[15px] truncate" style={{ color: "var(--txt)" }}>
                    {e.nom_affiche}
                  </div>
                  {e.is_me && (
                    <span className="mono text-[9px] rounded-full px-2 py-0.5 bg-red-50 text-(--blood) dark:bg-red-500/15 dark:text-red-400 font-bold tracking-wider">
                      VOUS
                    </span>
                  )}
                </div>
                <div className="text-[11.5px] mt-0.5" style={{ color: "var(--txt-mute)" }}>
                  {e.points.toLocaleString("fr-FR")} pts
                </div>
              </div>

              <GroupBadge groupe={e.groupe_sanguin} />

              <div className="flex items-baseline gap-1 shrink-0 ml-2">
                <span className="font-bold text-[18px] tabular-nums" style={{ color: "var(--txt)" }}>
                  {e.nb_dons}
                </span>
                <span className="text-[11px]" style={{ color: "var(--txt-mute)" }}>
                  dons
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─── Quick Links ─────────────────────────────────────────────── */
function QuickLinks({ s }: { s: DonorStats }) {
  const [qrOpen, setQrOpen] = useState(false);
  const { userId } = useAuth();

  return (
    <div className="grid grid-cols-2 gap-3 card-in" style={{ animationDelay: "280ms" }}>
      <Link
        to="/donor/appointments"
        className="surface flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors"
        style={{ textDecoration: "none", border: "1px solid var(--line)" }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: "var(--clinic-tint)", border: "1px solid transparent" }}
        >
          <Calendar size={18} style={{ color: "var(--clinic)" }} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm" style={{ color: "var(--txt)" }}>Mon RDV</div>
          <div className="mono text-[9px]" style={{ color: "var(--txt-mute)" }}>
            {s.prochain_don_eligible
              ? `J−${s.jours_avant_eligibilite}`
              : "Éligible"}
          </div>
        </div>
      </Link>

      <button
        onClick={() => setQrOpen(true)}
        className="surface flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left cursor-pointer hover:opacity-80"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
        >
          <QrCode size={18} style={{ color: "var(--txt-mute)" }} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm" style={{ color: "var(--txt)" }}>QR Donneur</div>
          <div className="mono text-[9px]" style={{ color: "var(--txt-mute)" }}>Accueil clinique</div>
        </div>
      </button>

      {/* QR Code Modal */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Mon Pass Donneur" subtitle="Accès Sécurisé">
        <div className="flex flex-col items-center p-4">
          <div className="mb-6 mono text-[12px] text-center" style={{ color: "var(--txt-dim)" }}>
            Présentez ce QR Code à l'accueil pour vous identifier instantanément.
          </div>
          
          <div className="relative">
            <div className="relative p-6 bg-white rounded-2xl border border-gray-100" style={{ boxShadow: "var(--shadow-md)" }}>
              <QRCode 
                value={`XEETALI:DONOR:${userId}`} 
                size={220}
                fgColor="#0f1629"
                bgColor="#ffffff"
                level="H" // High error correction level for better scanning
              />
              {/* Petits coins décoratifs */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br-lg"></div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Identifiant Unique</span>
            <div className="px-5 py-2 bg-gray-50 rounded-full border border-gray-100 font-bold tracking-widest text-lg text-gray-800 shadow-sm">
              DON-{userId?.toString().padStart(5, '0')}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Loading Skeletons ──────────────────────────────────────── */
function HomeSkeleton() {
  return (
    <>
      <Skeleton className="h-44 rounded-[20px]" />
      <Skeleton className="h-36 rounded-[20px]" />
      <Skeleton className="h-28 rounded-[20px]" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-[20px]" />
        <Skeleton className="h-20 rounded-[20px]" />
        <Skeleton className="h-20 rounded-[20px]" />
      </div>
      <Skeleton className="h-48 rounded-[20px]" />
    </>
  );
}

/* ─── Home Page ──────────────────────────────────────────────── */
function MobileDashboard({ s, board }: { s: DonorStats, board: any }) {
  const [activeTab, setActiveTab] = useState<'impact' | 'badges' | 'leaderboard'>('impact');

  return (
    <div className="flex flex-col space-y-5 pb-8">
      <NationalEmergencyBanner />
      <HeroCard s={s} />
      <PulseAction s={s} />
      <QuickLinks s={s} />
      
      {/* Premium Segmented Control for Mobile */}
      <div className="flex p-1.5 rounded-full mt-6 shadow-inner relative" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        {(['impact', 'badges', 'leaderboard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-full transition-colors z-10 ${
              activeTab === tab
                ? 'bg-(--clinic) text-white'
                : 'text-(--txt-mute) hover:text-(--txt)'
            }`}
          >
            {tab === 'leaderboard' ? 'Classement' : tab}
          </button>
        ))}
      </div>

      <div className="pt-6">
        <div style={{ display: activeTab === 'impact' ? 'block' : 'none' }}>
          <ImpactVisualizer s={s} />
        </div>
        <div style={{ display: activeTab === 'badges' ? 'block' : 'none' }}>
          <BadgeVault badges={s.badges} />
        </div>
        <div style={{ display: activeTab === 'leaderboard' ? 'block' : 'none' }}>
          {board.loading || !board.data ? (
            <Skeleton className="h-48 rounded-[20px]" />
          ) : (
            <EpicLeaderboard rows={board.data} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const stats = useApi(() => api.donorStats(),  []);
  const board = useApi(() => api.leaderboard(), []);

  return (
    <>


      {/* Loading States */}
      {stats.loading || !stats.data ? (
        <div className="w-full">
          <HomeSkeleton />
        </div>
      ) : (
        <>
          {/* MOBILE VIEW */}
          <div className="block md:hidden">
            <MobileDashboard s={stats.data} board={board} />
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:grid md:grid-cols-12 md:gap-6">
            {/* Colonne gauche (40% environ) */}
            <div className="md:col-span-5 space-y-5">
              <HeroCard s={stats.data} />
              <PulseAction s={stats.data} />
              <QuickLinks s={stats.data} />
            </div>

            {/* Colonne droite (60% environ) */}
            <div className="md:col-span-7 space-y-5">
              <NationalEmergencyBanner />
              <ImpactVisualizer s={stats.data} />
              <BadgeVault badges={stats.data.badges} />
              
              {board.loading || !board.data ? (
                <Skeleton className="h-48 rounded-[20px]" />
              ) : (
                <EpicLeaderboard rows={board.data} />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
