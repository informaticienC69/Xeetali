// DonorLayout.tsx — App Mobile "Command Center" XÉÉTALI
// Inspiré de la maquette.html mobile screen · Light + Dark
import { type ComponentType, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Home, LogOut, ScrollText, User, type LucideProps } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";

type LucideIcon = ComponentType<LucideProps>;

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/donor",              label: "Accueil",    icon: Home        },
  { to: "/donor/alerts",       label: "Alertes",    icon: Bell        },
  { to: "/donor/appointments", label: "RDV",        icon: CalendarDays},
  { to: "/donor/history",      label: "Mes dons",   icon: ScrollText  },
  { to: "/donor/profile",      label: "Profil",     icon: User        },
];

/* ── Pill indicator glissant ──────────────────────────────────── */
function PillIndicator({ activeIndex, tabCount }: { activeIndex: number; tabCount: number }) {
  const pct = 100 / tabCount;
  return (
    <span
      className="absolute top-0 left-0 h-[2px] rounded-full transition-all duration-300 ease-out"
      style={{
        width: `${pct}%`,
        transform: `translateX(${activeIndex * 100}%)`,
        background: "var(--blood)",
        boxShadow: "0 0 8px var(--blood)",
      }}
    />
  );
}

/* ── Donor App Layout ─────────────────────────────────────────── */
export default function DonorLayout({ children }: { children: ReactNode }) {
  const { nom, logout } = useAuth();
  const { mode, cycle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const prenom = (nom ?? "").split(" ")[0];
  const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  const activeIndex = TABS.findIndex((t) =>
    t.to === "/donor" ? pathname === "/donor" : pathname.startsWith(t.to)
  );

  return (
    <div className="flex min-h-screen justify-center" style={{ background: "var(--bg-2)" }}>
      <div
        className="relative flex w-full max-w-md flex-col"
        style={{ background: "var(--bg)", minHeight: "100svh" }}
      >
        {/* ── App Bar ── */}
        <header
          className="relative px-5 pb-5 pt-5 overflow-hidden"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
        >
          {/* Ligne rouge en haut (maquette style) */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
               style={{ background: "var(--blood)", boxShadow: "0 0 12px var(--blood)" }} />

          <div className="flex items-start justify-between">
            <div>
              {/* Greeting DM Mono style maquette */}
              <div className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--txt-mute)" }}>
                Bonjour
              </div>
              <h1 className="syne font-bold text-xl mt-0.5" style={{ color: "var(--txt)" }}>
                {prenom || "Donneur"} 👋
              </h1>
              <p className="mono text-[10px] mt-1 italic" style={{ color: "var(--txt-mute)" }}>
                "Joxal sa dërew, mu jox aye dund"
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Thème */}
              <button
                onClick={cycle}
                className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--txt-mute)", background: "var(--surface-2)" }}
                aria-label="Changer de thème"
              >
                <ThemeIcon size={16} />
              </button>
              {/* Bell */}
              <NavLink
                to="/donor/alerts"
                className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--txt-mute)", background: "var(--surface-2)" }}
              >
                <Bell size={16} />
              </NavLink>
              {/* Logout */}
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--txt-mute)", background: "var(--surface-2)" }}
                aria-label="Déconnexion"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Contenu ── */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 pt-4 view-fade">
          {children}
        </main>

        {/* ── TabBar style maquette ── */}
        <nav
          className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2"
          style={{
            background: "var(--surface)",
            borderTop: "1px solid var(--line)",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          }}
        >
          {/* Conteneur avec pill indicator */}
          <div
            className="relative mx-2 mt-1.5 mb-1 flex rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-2)", padding: 4, borderRadius: 18 }}
          >
            {/* Pill slide */}
            <PillIndicator activeIndex={Math.max(0, activeIndex)} tabCount={TABS.length} />

            {TABS.map(({ to, label, icon: Icon }) => {
              const active = to === "/donor" ? pathname === "/donor" : pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/donor"}
                  className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[9px] font-medium transition-all duration-200 active:scale-95"
                  style={{
                    color: active ? "var(--blood)" : "var(--txt-mute)",
                    background: active ? "rgba(230,57,70,0.10)" : "transparent",
                  }}
                >
                  <Icon size={18} />
                  <span className="mono uppercase tracking-wider">{label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Safe area */}
          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </nav>
      </div>
    </div>
  );
}
