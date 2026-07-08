// Home.tsx — Interface Donneur "Hors Norme" · Xéétali v2
// Refonte complète : Glassmorphism · Holographic · Gamification · Urgence Émotionnelle
import { Link } from "react-router-dom";
import {
  Calendar, ChevronRight, Crown, Droplet, Flame, Heart,
  HeartPulse, Lock, Medal, QrCode, Star, Trophy, Zap,
  Globe2, Gem, Activity, Share2
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
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

/* ─── FloatingCTA ────────────────────────────────────────────── */
function FloatingCTA({ eligible }: { eligible: boolean }) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const el = document.querySelector("main");
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      setVisible(y < lastY.current || y < 60);
      lastY.current = y;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      to="/donor/appointments"
      className="slide-in-bottom"
      style={{
        position: "fixed",
        bottom: 88,
        right: 16,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 18px",
        borderRadius: 50,
        background: eligible
          ? "linear-gradient(135deg, #ef3a48 0%, #c1232f 100%)"
          : "linear-gradient(135deg, #1d3557 0%, #0f1e3a 100%)",
        color: "#fff",
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        boxShadow: eligible
          ? "0 4px 24px rgba(230,57,70,0.55)"
          : "0 4px 16px rgba(0,0,0,0.30)",
        textDecoration: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <span
        className={eligible ? "heartbeat" : "float-up"}
        style={{ display: "flex", alignItems: "center" }}
      >
        {eligible ? <Heart size={16} fill="white" /> : <Calendar size={16} />}
      </span>
      {eligible ? "Donner maintenant" : "Planifier mon don"}
    </Link>
  );
}

/* ─── HeroCard ───────────────────────────────────────────────── */
function HeroCard({ s }: { s: DonorStats }) {
  const color  = LEVEL_COLORS[s.niveau_index] ?? "#64748b";
  const pct    = Math.round(s.progression * 100);
  const next   = LEVEL_NAMES[s.niveau_index + 1];
  const streak = s.streak_annees;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 18;
    const y = ((e.clientY - top) / height - 0.5) * -12;
    el.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "rotateY(0deg) rotateX(0deg)";
  }, []);

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
        ref={cardRef}
        className="tilt-card relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          borderRadius: 20,
          padding: "22px 20px",
          background: `linear-gradient(135deg, ${color}28 0%, var(--surface) 55%, ${color}10 100%)`,
          border: `1px solid ${color}50`,
          boxShadow: `0 8px 32px ${color}25, 0 2px 8px rgba(0,0,0,0.08)`,
        }}
      >
        {/* Reflet holographique */}
        <div className="holo-shimmer absolute inset-0 rounded-[20px]" />

        {/* Header : niveau + points */}
        <div className="relative flex items-start gap-4">
          {/* Icône niveau */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
              border: `1.5px solid ${color}60`,
              boxShadow: `0 0 20px ${color}30`,
            }}
          >
            <Medal size={26} style={{ color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
              Votre niveau
            </div>
            <div
              className="syne font-extrabold text-2xl neon-blood-text"
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
              className="syne font-extrabold text-3xl tabular-nums neon-gold-text"
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
            className="relative mt-4 flex items-center gap-2 rounded-xl px-3 py-2 bounce-in-scale"
            style={{
              background: "linear-gradient(90deg, rgba(239,58,72,0.12) 0%, rgba(234,179,8,0.08) 100%)",
              border: "1px solid rgba(239,58,72,0.25)",
              animationDelay: "300ms",
            }}
          >
            <Flame size={14} style={{ color: "#f97316" }} />
            <span className="syne font-bold text-sm" style={{ color: "var(--txt)" }}>
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
                background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                boxShadow: `0 0 10px ${color}80`,
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
          borderRadius: 20,
          padding: "24px 20px",
          background: "linear-gradient(135deg, rgba(230,57,70,0.15) 0%, rgba(230,57,70,0.06) 50%, rgba(139,92,246,0.06) 100%)",
          border: "1px solid rgba(230,57,70,0.40)",
          boxShadow: "0 0 0 1px rgba(230,57,70,0.20), 0 8px 32px rgba(230,57,70,0.20)",
          animationDelay: "80ms",
        }}
      >
        {/* Particules flottantes */}
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="particle absolute w-2 h-2 rounded-full"
            style={{
              left: `${12 + i * 15}%`,
              bottom: "20%",
              background: i % 2 === 0 ? "var(--blood)" : "rgba(230,57,70,0.5)",
              "--dur": `${2.2 + i * 0.4}s`,
              "--delay": `${i * 0.35}s`,
              boxShadow: "0 0 6px var(--blood-glow)",
            } as React.CSSProperties}
          />
        ))}

        {/* Badge "Héros Requis" */}
        <div className="relative flex items-center gap-2 mb-4">
          <div
            className="bounce-in-scale flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: "rgba(230,57,70,0.15)", border: "1px solid rgba(230,57,70,0.40)" }}
          >
            <Zap size={11} style={{ color: "var(--blood)" }} />
            <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--blood)" }}>
              Héros Requis
            </span>
          </div>
          <span className="pulse-soft mono text-[10px]" style={{ color: "var(--txt-mute)" }}>MAINTENANT</span>
        </div>

        <div className="relative">
          <p className="syne font-extrabold text-xl leading-tight" style={{ color: "var(--txt)" }}>
            Le Sénégal a besoin<br />
            <span className="pulse-text" style={{ color: "var(--blood)" }}>de vous aujourd'hui</span>
          </p>
          <p className="mono text-[11px] mt-2" style={{ color: "var(--txt-dim)" }}>
            Un don de votre sang peut sauver jusqu'à 3 vies. Vous êtes éligible maintenant.
          </p>
        </div>

        {/* CTA principal avec ondes */}
        <div className="relative mt-5 flex justify-center">
          {/* Ondes concentriques */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {["ring-expand-1", "ring-expand-2", "ring-expand-3"].map((cls) => (
              <div
                key={cls}
                className={`${cls} absolute w-14 h-14 rounded-full`}
                style={{ border: "2px solid rgba(230,57,70,0.35)" }}
              />
            ))}
          </div>

          <Link
            to="/donor/appointments"
            className="heartbeat btn-blood relative inline-flex items-center gap-2.5 px-6 py-3.5 text-base"
            style={{ borderRadius: 50, zIndex: 1, fontSize: 15 }}
          >
            <Heart size={18} fill="white" />
            Sauver une vie maintenant
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
              stroke="var(--blood)"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
              style={{ transition: "stroke-dashoffset 1.5s ease", filter: "drop-shadow(0 0 4px var(--blood))" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="syne font-extrabold text-sm" style={{ color: "var(--blood)" }}>{pct}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
            Prochain don possible dans
          </div>
          <div className="syne font-extrabold text-3xl tabular-nums mt-0.5 mb-1" style={{ color: "var(--txt)" }}>
            <CountUp value={jours} duration={1200} />
            <span className="syne font-semibold text-base ml-1.5" style={{ color: "var(--txt-dim)" }}>jours</span>
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
        className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all"
        style={{
          background: "rgba(230,57,70,0.07)",
          border: "1px solid rgba(230,57,70,0.20)",
          textDecoration: "none",
        }}
      >
        <Calendar size={14} style={{ color: "var(--blood)" }} />
        <span className="syne font-semibold text-sm flex-1" style={{ color: "var(--txt)" }}>
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
        borderRadius: 24,
        padding: "24px",
        background: "linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(139,0,0,0.20) 100%)",
        border: "1px solid rgba(230,57,70,0.4)",
        boxShadow: "0 8px 32px rgba(230,57,70,0.15)",
        animationDelay: "120ms",
      }}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Pulsing Icon */}
        <div className="shrink-0 relative">
          <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: "var(--blood)" }} />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(230,57,70,0.15)", border: "1px solid rgba(230,57,70,0.3)" }}>
            <Activity size={26} style={{ color: "var(--blood)" }} />
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
          
          <div className="syne font-extrabold text-xl leading-tight mt-1" style={{ color: "var(--txt)" }}>
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
              style={{ width: `${capacite_pct}%`, background: "var(--blood)", boxShadow: "0 0 10px var(--blood-glow)" }}
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
    { v: s.nb_dons,           label: "Dons réalisés",    icon: Droplet,    color: "var(--blood)" },
    { v: s.vies_potentielles, label: "Vies touchées",    icon: Heart,      color: "#f43f5e" },
    { v: Math.round(s.total_volume_ml ?? s.nb_dons * 450), label: "mL donnés",  icon: HeartPulse, color: "#8b5cf6" },
  ];

  return (
    <div
      className="card-in relative overflow-hidden"
      style={{
        borderRadius: 24,
        padding: "24px",
        background: "linear-gradient(145deg, var(--surface) 0%, var(--bg-2) 100%)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-lg)",
        animationDelay: "160ms"
      }}
    >
      {/* Subtle Glow Background */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, var(--blood-glow) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="mono text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--txt-mute)" }}>
          <Globe2 size={14} style={{ color: "var(--blood)" }} /> Votre Impact Réel
        </div>
      </div>

      <div className="flex flex-col gap-3 relative z-10">
        {stats.map(({ v, label, icon: Icon, color }, i) => (
          <div
            key={label}
            className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-default"
            style={{ 
              background: "var(--surface)", 
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:rotate-[8deg] group-hover:scale-110"
              style={{ background: "var(--surface-2)", border: `1px solid var(--line)`, color }}
            >
              <Icon size={20} />
            </div>
            
            <div className="flex-1 flex items-center justify-between">
              <div className="syne font-bold text-sm tracking-wide" style={{ color: "var(--txt-dim)" }}>
                {label}
              </div>
              <div className="syne font-black text-2xl tabular-nums tracking-tight" style={{ color: "var(--txt)" }}>
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
      className="card-in relative overflow-hidden"
      style={{
        borderRadius: 24,
        padding: "24px",
        background: "linear-gradient(145deg, var(--surface) 0%, var(--bg-2) 100%)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-lg)",
        animationDelay: "200ms"
      }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="mono text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--txt-mute)" }}>
          <Medal size={14} style={{ color: "#eab308" }} /> Votre Arsenal
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #eab308, var(--blood))" }} />
          </div>
          <div className="mono text-[10px] font-bold" style={{ color: "var(--txt-dim)" }}>
            {obtained}/{badges.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((b, i) => {
          const BadgeIcon = BADGE_ICONS[b.code] || Star;
          
          return (
            <div
              key={b.code}
              title={b.obtenu ? b.description : `[Bloqué] ${b.description}`}
              className={`group relative flex flex-col items-center justify-center p-5 rounded-[20px] transition-all duration-500 ${
                b.obtenu ? "cursor-pointer hover:-translate-y-1" : "opacity-60 grayscale"
              }`}
              style={{
                background: b.obtenu ? "var(--surface)" : "var(--bg)",
                border: "1px solid",
                borderColor: b.obtenu ? "var(--blood-glow)" : "var(--line)",
                boxShadow: b.obtenu ? "var(--shadow-md)" : "none",
                animationDelay: `${i * 60}ms`
              }}
            >
              {b.obtenu && (
                <div className="absolute inset-0 rounded-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at center, var(--blood-glow) 0%, transparent 70%)" }} />
              )}
              
              <div
                className="relative flex items-center justify-center w-14 h-14 rounded-full mb-3 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
                style={{
                  background: b.obtenu ? "var(--surface-2)" : "var(--bg-2)",
                  border: b.obtenu ? "1px solid var(--blood-glow)" : "1px solid var(--line)",
                  boxShadow: b.obtenu ? "inset 0 2px 4px rgba(255,255,255,0.15)" : "none"
                }}
              >
                {b.obtenu ? (
                  <BadgeIcon size={22} style={{ color: "var(--blood)", filter: "drop-shadow(0 2px 4px var(--blood-glow))" }} />
                ) : (
                  <Lock size={16} style={{ color: "var(--txt-mute)" }} />
                )}
              </div>

              <div className="syne font-bold text-[11px] leading-tight text-center z-10 tracking-wide" style={{ color: b.obtenu ? "var(--txt)" : "var(--txt-mute)" }}>
                {b.label}
              </div>
              
              {!b.obtenu && b.seuil > 0 && (
                <div className="mono text-[9px] mt-1.5" style={{ color: "var(--txt-dim)" }}>
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
const RANK_AURA: Record<number, string> = { 1: "aura-gold", 2: "aura-silver", 3: "aura-bronze" };
const RANK_COLOR: Record<number, string> = { 1: "#eab308", 2: "#94a3b8", 3: "#b45309" };
const CHALLENGE_TARGET = 1000;
const CHALLENGE_CURRENT = 847;

function EpicLeaderboard({ rows }: { rows: LeaderboardEntry[] }) {
  const challengePct = Math.round((CHALLENGE_CURRENT / CHALLENGE_TARGET) * 100);

  return (
    <div
      className="card-in surface"
      style={{ borderRadius: 20, padding: "20px", animationDelay: "240ms" }}
    >
      {/* Community Challenge */}
      <div
        className="mb-5 rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(234,179,8,0.10) 0%, rgba(230,57,70,0.07) 100%)",
          border: "1px solid rgba(234,179,8,0.30)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Star size={13} style={{ color: "#eab308" }} className="trophy-glow" />
          <span className="syne font-bold text-sm" style={{ color: "var(--txt)" }}>
            Défi Communauté
          </span>
          <span className="mono text-[9px] ml-auto" style={{ color: "var(--txt-mute)" }}>Se termine vendredi</span>
        </div>
        <div className="syne font-extrabold text-base leading-tight" style={{ color: "var(--txt)" }}>
          Objectif{" "}
          <CountUp value={CHALLENGE_TARGET} duration={1400} />
          {" "}dons
        </div>
        <div className="mono text-[10px] mt-0.5" style={{ color: "var(--txt-dim)" }}>
          <CountUp value={CHALLENGE_CURRENT} duration={1200} /> atteints · encore {CHALLENGE_TARGET - CHALLENGE_CURRENT} à faire !
        </div>
        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
          <div
            className="challenge-fill h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #eab308 0%, #ef3a48 100%)",
              boxShadow: "0 0 8px rgba(234,179,8,0.50)",
              "--challenge-pct": `${challengePct}%`,
            } as React.CSSProperties}
          />
        </div>
        <div className="mt-1 mono text-[10px] text-right" style={{ color: "var(--txt-mute)" }}>{challengePct}%</div>
      </div>

      {/* Leaderboard header */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={14} style={{ color: "var(--blood)" }} />
        <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
          Classement des donneurs
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((e, i) => {
          const initials = e.nom_affiche.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const bgCol    = avatarColor(e.nom_affiche);
          const aura     = RANK_AURA[e.rang] ?? "";
          const rankCol  = RANK_COLOR[e.rang];

          return (
            <li
              key={e.rang}
              className={`row-fade-in flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all`}
              style={{
                animationDelay: `${i * 60}ms`,
                background: e.is_me
                  ? "linear-gradient(90deg, rgba(230,57,70,0.10) 0%, rgba(230,57,70,0.04) 100%)"
                  : "transparent",
                border: e.is_me
                  ? "1px solid rgba(230,57,70,0.25)"
                  : "1px solid transparent",
              }}
            >
              {/* Rank badge */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mono text-xs font-black ${aura}`}
                style={{
                  background: rankCol ? `${rankCol}22` : "var(--surface-2)",
                  color: rankCol ?? "var(--txt-mute)",
                }}
              >
                {e.rang <= 3
                  ? <Crown size={14} className={e.rang === 1 ? "trophy-glow" : ""} style={{ color: rankCol }} />
                  : e.rang}
              </span>

              {/* Avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mono text-[11px] font-black"
                style={{ background: bgCol, color: "#fff", flexShrink: 0 }}
              >
                {initials}
              </div>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <div className="syne font-semibold text-sm truncate" style={{ color: "var(--txt)" }}>
                  {e.nom_affiche}
                  {e.is_me && (
                    <span className="ml-1.5 mono text-[9px] rounded-full px-1.5 py-0.5 pulse-soft"
                      style={{ background: "rgba(230,57,70,0.15)", color: "var(--blood)" }}>
                      vous
                    </span>
                  )}
                </div>
                <div className="mono text-[9px]" style={{ color: "var(--txt-mute)" }}>
                  {e.points.toLocaleString("fr-FR")} pts
                </div>
              </div>

              <GroupBadge groupe={e.groupe_sanguin} />

              <span className="mono text-sm font-bold tabular-nums shrink-0" style={{ color: "var(--txt-dim)" }}>
                {e.nb_dons}
                <span className="font-normal text-[10px] ml-0.5" style={{ color: "var(--txt-mute)" }}>dons</span>
              </span>
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
        className="surface flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
        style={{ textDecoration: "none", border: "1px solid rgba(230,57,70,0.25)" }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.30)" }}
        >
          <Calendar size={18} style={{ color: "var(--blood)" }} />
        </div>
        <div className="min-w-0">
          <div className="syne font-semibold text-sm" style={{ color: "var(--txt)" }}>Mon RDV</div>
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
          <div className="syne font-semibold text-sm" style={{ color: "var(--txt)" }}>QR Donneur</div>
          <div className="mono text-[9px]" style={{ color: "var(--txt-mute)" }}>Accueil clinique</div>
        </div>
      </button>

      {/* QR Code Modal */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Mon Pass Donneur" subtitle="Accès Sécurisé">
        <div className="flex flex-col items-center p-4">
          <div className="mb-6 mono text-[12px] text-center" style={{ color: "var(--txt-dim)" }}>
            Présentez ce QR Code à l'accueil pour vous identifier instantanément.
          </div>
          
          <div className="relative group">
            {/* Effet de lueur en arrière-plan */}
            <div className="absolute -inset-1 bg-linear-to-r from-red-500 to-rose-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            
            <div className="relative p-6 bg-white rounded-3xl border border-gray-100" style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
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
            <div className="px-5 py-2 bg-gray-50 rounded-full border border-gray-100 syne font-bold tracking-widest text-lg text-gray-800 shadow-sm">
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
export default function Home() {
  const stats = useApi(() => api.donorStats(),  []);
  const board = useApi(() => api.leaderboard(), []);

  return (
    <div className="space-y-4">
      {/* Floating CTA — toujours présent */}
      {stats.data && <FloatingCTA eligible={stats.data.eligible_maintenant} />}

      {/* États de chargement */}
      {stats.loading || !stats.data ? (
        <HomeSkeleton />
      ) : (
        <>
          {/* ① Carte de Héros holographique */}
          <HeroCard s={stats.data} />

          {/* ② Action pulsante (eligible ou attente) */}
          <PulseAction s={stats.data} />

          {/* ③ Bannière d'urgence nationale */}
          <NationalEmergencyBanner />

          {/* ④ Impact réel visuel */}
          <ImpactVisualizer s={stats.data} />

          {/* ⑤ Arsenal de badges */}
          <BadgeVault badges={stats.data.badges} />

          {/* ⑥ Liens rapides */}
          <QuickLinks s={stats.data} />
        </>
      )}

      {/* ⑦ Classement épique */}
      {board.loading || !board.data
        ? <Skeleton className="h-48 rounded-[20px]" />
        : <EpicLeaderboard rows={board.data} />}
    </div>
  );
}
