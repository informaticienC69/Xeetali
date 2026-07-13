// DonorLayout.tsx — App Mobile "Command Center" XÉÉTALI
// Inspiré de la maquette.html mobile screen · Light + Dark
import { type ComponentType, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Home, LogOut, ScrollText, User, type LucideProps } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Monitor, Moon, Sun, Hand, Sparkles } from "lucide-react";

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
        className="relative flex w-full flex-col"
        style={{ background: "var(--bg)", minHeight: "100svh" }}
      >
        {/* ── Effets Command Center supprimés ── */}

        {/* ── App Bar ── */}
        <header
          className="relative px-5 pb-4 pt-6 overflow-hidden"
          style={{ background: "transparent" }}
        >
          {/* Lumière rouge diffuse en haut (Néon) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-16 pointer-events-none"
               style={{ background: "radial-gradient(ellipse at top, rgba(230,57,70,0.12) 0%, transparent 70%)", filter: "blur(20px)" }} />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              {/* Avatar Glassmorphic */}
              <div className="relative shrink-0 group cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:scale-105 rounded-full">
                <div 
                  className="relative flex items-center justify-center w-[46px] h-[46px] rounded-full syne font-extrabold text-[13px] tracking-wider backdrop-blur-md" 
                  style={{ 
                    background: "linear-gradient(135deg, rgba(230,57,70,0.15) 0%, rgba(230,57,70,0.02) 100%)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
                    border: "1px solid rgba(230,57,70,0.3)",
                    color: "var(--blood)",
                    textShadow: "0 0 12px rgba(230,57,70,0.5)"
                  }}
                >
                  {prenom ? prenom.substring(0, 2).toUpperCase() : "DO"}
                </div>
              </div>

              {/* Texte Identité */}
              <div>
                <h1 className="syne font-extrabold text-[20px] leading-tight flex items-center gap-1.5" style={{ color: "var(--txt)" }}>
                  {prenom || "Donneur"} <Hand size={16} style={{ color: "#f59e0b" }} className="animate-[wiggle_1s_ease-in-out_infinite] origin-bottom-right" />
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles size={10} style={{ color: "var(--blood)" }} />
                  <p className="mono text-[10px] italic" style={{ color: "var(--txt-dim)" }}>
                    "Joxal sa dërew, mu jox aye dund"
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Thème */}
              <button
                onClick={cycle}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-white/10 active:scale-95"
                style={{ color: "var(--txt-mute)" }}
                aria-label="Changer de thème"
              >
                <ThemeIcon size={18} />
              </button>
              {/* Bell avec pastille rouge */}
              <NavLink
                to="/donor/alerts"
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-white/10 active:scale-95"
                style={{ color: "var(--txt-mute)" }}
              >
                <Bell size={18} />
                <span className="absolute top-[10px] right-[10px] w-[6px] h-[6px] rounded-full animate-pulse" style={{ background: "var(--blood)", boxShadow: "0 0 6px var(--blood-glow)" }} />
              </NavLink>
              {/* Logout */}
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-red-500/10 hover:text-red-500 active:scale-95"
                style={{ color: "var(--txt-mute)" }}
                aria-label="Se déconnecter"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Contenu ── */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 pt-4 view-fade relative z-10 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          {/* Footer global */}
          <div className="text-center mono text-[10px] py-4 mt-8 shrink-0" style={{ color: "var(--txt-mute)" }}>
            XÉÉTALI · CNTS Sénégal · Données hébergées à Diamniadio · Conforme CDP loi 2008-12
          </div>
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
