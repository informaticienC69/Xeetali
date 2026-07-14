// Layout.tsx — Sidebar Admin "Command Center" XÉÉTALI
// Inspiré de la maquette.html · Light + Dark · Syne + DM Mono
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Bell,
  Building2,
  Droplet,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Users,
  Activity,
  ClipboardList,
  FileCheck,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import type { Role } from "../lib/api";

// ── Nav items par rôle ─────────────────────────────────────────
interface NavItem {
  to: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
}

const ADMIN_NAV: NavItem[] = [
  { to: "/admin",           label: "Command Center",  sub: "Tableau de bord",      icon: LayoutDashboard },
  { to: "/admin/transfer",  label: "Transferts",      sub: "Routing poches",       icon: ArrowLeftRight  },
  { to: "/admin/campaign",  label: "Alerte Nationale",sub: "SMS · Push",          icon: Bell            },
  { to: "/admin/users",     label: "Utilisateurs",    sub: "Gestion des comptes",  icon: Users           },
  { to: "/admin/hospitals", label: "Établissements",  sub: "Réseau hospitalier",   icon: Building2       },
];

const MEDICAL_NAV: NavItem[] = [
  { to: "/medical",           label: "Vue d'ensemble",  sub: "Dashboard hôpital",   icon: LayoutDashboard },
  { to: "/medical/register",  label: "Enregistrement",  sub: "Nouvelle poche",      icon: Droplet         },
  { to: "/medical/stock",     label: "Stock & Urgence", sub: "Recherche poches",    icon: ClipboardList   },
  { to: "/medical/validity",  label: "Contrôle",        sub: "Péremptions",         icon: FileCheck       },
  { to: "/medical/request",   label: "Demandes",        sub: "Besoins hospitaliers",icon: Activity        },
];

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN_CNTS:        ADMIN_NAV,
  PERSONNEL_MEDICAL: MEDICAL_NAV,
  DONNEUR:           [],
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN_CNTS:        "CNTS · Admin",
  PERSONNEL_MEDICAL: "Personnel Médical",
  DONNEUR:           "Donneur",
};

const ROLE_ACRONYM: Record<Role, string> = {
  ADMIN_CNTS:        "AD",
  PERSONNEL_MEDICAL: "PM",
  DONNEUR:           "DN",
};

// ── Horloge temps réel ─────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="mono tabular-nums" style={{ color: "var(--txt)" }}>
      {now.toLocaleTimeString("fr-FR", { hour12: false })}
    </span>
  );
}

// ── NavItem ────────────────────────────────────────────────────
function SideNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to.split("/").length === 2}
      className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 overflow-hidden"
      style={({ isActive }) => ({
        background: isActive ? "var(--surface-2)" : "transparent",
        color: isActive ? "var(--txt)" : "var(--txt-mute)",
      })}
    >
      {({ isActive }) => (
        <>
          {/* Barre latérale active (sobre, bleu clinique) */}
          {isActive && (
            <span
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r"
              style={{ background: "var(--clinic)" }}
            />
          )}
          <item.icon
            size={17}
            style={{ color: isActive ? "var(--clinic)" : "var(--txt-mute)", flexShrink: 0 }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm leading-none truncate"
                 style={{ color: isActive ? "var(--txt)" : "var(--txt-dim)" }}>
              {item.label}
            </div>
            {item.sub && (
              <div className="mono text-[9px] uppercase tracking-wider mt-0.5 truncate"
                   style={{ color: "var(--txt-mute)" }}>
                {item.sub}
              </div>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

// ── Sidebar ────────────────────────────────────────────────────
export default function Layout({ children }: { children: ReactNode }) {
  const { nom, role, logout } = useAuth();
  const { mode, cycle } = useTheme();
  const navigate = useNavigate();
  const nav = role ? (NAV_BY_ROLE[role] ?? []) : [];
  const prenom = (nom ?? "").split(" ")[0];
  const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Sidebar ── */}
      <aside
        className="flex w-64 shrink-0 flex-col"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--line)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6" style={{ borderBottom: "1px solid var(--line)" }}>
          {/* Icône logo — pastille sobre */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--blood)", boxShadow: "var(--shadow-sm)" }}
          >
            <Droplet size={22} strokeWidth={2} style={{ color: "#fff", fill: "rgba(255,255,255,0.25)" }} />
          </div>

          <div className="flex flex-col justify-center">
            {/* Mot-marque : seule place où Syne est conservée (branding) */}
            <div className="font-bold tracking-[0.14em] text-[16px] leading-none">
              <span style={{ color: "var(--txt)" }}>X</span>
              <span style={{ color: "var(--blood)" }}>É</span>
              <span style={{ color: "var(--txt)" }}>ÉTALI</span>
            </div>
            <div className="mono text-[8.5px] uppercase tracking-[0.22em] mt-1.5" style={{ color: "var(--txt-mute)" }}>
              Node Central · CNTS
            </div>
          </div>
        </div>

        {/* Statut système */}
        <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2">
            <span className="status-dot" style={{ background: "var(--ok)" }} />
            <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
              Système <span style={{ color: "var(--ok)" }}>opérationnel</span>
            </span>
          </div>
        </div>

        {/* Label section */}
        <div className="px-4 pt-4 pb-1">
          <div className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
            Navigation
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-1 space-y-0.5">
          {nav.map((item) => (
            <SideNavItem key={item.to} item={item} />
          ))}
        </nav>

        {/* Footer : utilisateur + thème + déconnexion */}
        <div style={{ borderTop: "1px solid var(--line)" }}>
          {/* Statut LoRaWAN supprimé */}

          {/* Utilisateur */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            {/* Avatar initiales */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-[13px]"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                color: "var(--txt-dim)",
              }}
            >
              {role ? ROLE_ACRONYM[role] : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate" style={{ color: "var(--txt)" }}>
                {prenom || "Utilisateur"}
              </div>
              <div className="mono text-[9px] uppercase tracking-wider truncate" style={{ color: "var(--txt-mute)" }}>
                {role ? ROLE_LABEL[role] : "—"}
              </div>
            </div>

            {/* Thème */}
            <button
              onClick={cycle}
              title="Changer de thème"
              aria-label="Changer de thème"
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--txt-mute)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--txt)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--txt-mute)"; }}
            >
              <ThemeIcon size={15} />
            </button>

            {/* Déconnexion */}
            <button
              onClick={() => { logout(); navigate("/login"); }}
              title="Déconnexion"
              aria-label="Déconnexion"
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--txt-mute)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--crit)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--txt-mute)"; }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main
        className="flex flex-1 flex-col overflow-hidden relative"
        style={{ background: "var(--bg)" }}
      >
        {/* ── Effets Command Center supprimés ── */}

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0 relative z-10"
          style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}
        >
          <div className="mono text-[11px] uppercase tracking-wider flex items-center gap-3" style={{ color: "var(--txt-mute)" }}>
            <span className="status-dot" style={{ background: "var(--ok)" }} />
            v1.4.0
          </div>
          <div className="flex items-center gap-3 mono text-[11px]" style={{ color: "var(--txt-mute)" }}>
            <span className="hidden sm:block uppercase tracking-wider">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}
            </span>
            <LiveClock />
          </div>
        </div>

        {/* Page scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 view-fade relative z-10 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          {/* Footer global */}
          <div className="text-center mono text-[10px] py-4 mt-8 shrink-0" style={{ color: "var(--txt-mute)" }}>
            XÉÉTALI · CNTS Sénégal · Données hébergées à Diamniadio · Conforme CDP loi 2008-12
          </div>
        </div>
      </main>
    </div>
  );
}
