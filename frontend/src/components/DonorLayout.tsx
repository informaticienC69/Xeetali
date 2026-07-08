// DonorLayout.tsx — App Mobile "Command Center" XÉÉTALI
// Inspiré de la maquette.html mobile screen · Light + Dark
import { type ComponentType, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Home, LogOut, ScrollText, User, type LucideProps } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Monitor, Moon, Sun, Hand } from "lucide-react";

type LucideIcon = ComponentType<LucideProps>;

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/donor",              label: "Accueil",    icon: Home        },
  { to: "/donor/alerts",       label: "Alertes",    icon: Bell        },
  { to: "/donor/appointments", label: "RDV",        icon: CalendarDays},
  { to: "/donor/history",      label: "Mes dons",   icon: ScrollText  },
  { to: "/donor/profile",      label: "Profil",     icon: User        },
];



/* ── Donor App Layout ─────────────────────────────────────────── */
export default function DonorLayout({ children }: { children: ReactNode }) {
  const { nom, logout } = useAuth();
  const { mode, cycle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const prenom = (nom ?? "").split(" ")[0];
  const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;


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
              <h1 className="syne font-bold text-xl mt-0.5 flex items-center gap-1.5" style={{ color: "var(--txt)" }}>
                {prenom || "Donneur"} <Hand size={18} style={{ color: "#f59e0b" }} className="animate-pulse" />
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

        {/* ── Floating Glass Navbar ── */}
        <nav
          className="fixed bottom-6 left-1/2 z-30 w-[92%] max-w-[400px] -translate-x-1/2 rounded-full"
          style={{
            background: "color-mix(in srgb, var(--surface) 70%, transparent)",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            border: "1px solid color-mix(in srgb, var(--line) 50%, rgba(255,255,255,0.1))",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 12px 40px rgba(0,0,0,0.2)",
            padding: "8px 12px"
          }}
        >
          <div className="flex items-center justify-between">
            {TABS.map(({ to, label, icon: Icon }) => {
              const active = to === "/donor" ? pathname === "/donor" : pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/donor"}
                  className="flex flex-col items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 flex-1 h-14 rounded-full"
                  style={{
                    color: active ? "var(--blood)" : "var(--txt-mute)",
                  }}
                >
                  <div className="relative">
                    <Icon size={22} strokeWidth={active ? 2.5 : 1.5} className="transition-all duration-300" style={{ filter: active ? "drop-shadow(0 2px 8px var(--blood-glow))" : "none" }} />
                    {active && (
                      <div className="absolute -bottom-2 left-1/2 w-1 h-1 rounded-full -translate-x-1/2 transition-all" style={{ background: "var(--blood)", boxShadow: "0 0 8px var(--blood)" }} />
                    )}
                  </div>
                  <span 
                    className="syne text-[10px] font-semibold transition-all duration-300"
                    style={{ opacity: active ? 1 : 0.7 }}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
