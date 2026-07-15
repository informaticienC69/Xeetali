// DonorLayout.tsx — App Mobile "Command Center" XÉÉTALI
// Inspiré de la maquette.html mobile screen · Light + Dark
//
// < lg (1024px) : chrome mobile dédié (app bar + nav flottante en bas) —
// inchangé, c'est la référence UX du rôle donneur.
// ≥ lg : réutilise directement <Layout> (même sidebar que Admin/Médical,
// alimentée via NAV_BY_ROLE.DONNEUR) plutôt que de dupliquer sa structure —
// garantit une vraie cohérence visuelle, pas une simple resemblance, et reste
// synchronisé si Layout évolue plus tard.
import { type ComponentType, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Home, LogOut, ScrollText, User, type LucideProps } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useMediaQuery } from "../lib/hooks";
import { NEXT_THEME_LABEL, useTheme } from "../lib/theme";
import { Monitor, Moon, Sun, Hand, Sparkles } from "lucide-react";
import Layout from "./Layout";

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
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return <Layout>{children}</Layout>;
  }

  return (
    <div className="flex min-h-screen justify-center" style={{ background: "var(--bg-2)" }}>
      <div
        className="donor-shell relative flex w-full flex-col"
        style={{ background: "var(--bg)", minHeight: "100svh" }}
      >
        {/* ── Effets Command Center supprimés ── */}

        {/* ── App Bar ── */}
        <header className="relative px-5 pb-4 pt-6" style={{ background: "transparent" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {/* Avatar — pastille sobre */}
              <div
                className="flex items-center justify-center w-[46px] h-[46px] rounded-full font-bold text-[13px] shrink-0"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  color: "var(--txt-dim)",
                }}
              >
                {prenom ? prenom.substring(0, 2).toUpperCase() : "DO"}
              </div>

              {/* Texte Identité */}
              <div>
                <h1 className="font-bold text-[20px] leading-tight flex items-center gap-1.5" style={{ color: "var(--txt)", letterSpacing: "-0.01em" }}>
                  {prenom || "Donneur"} <Hand size={16} style={{ color: "var(--warn)" }} />
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles size={10} style={{ color: "var(--txt-mute)" }} />
                  <p className="text-[11px] italic" style={{ color: "var(--txt-dim)" }}>
                    « Joxal sa dërew, mu jox aye dund »
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Thème */}
              <button
                onClick={cycle}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-95"
                style={{ color: "var(--txt-mute)" }}
                aria-label={NEXT_THEME_LABEL[mode]}
                title={NEXT_THEME_LABEL[mode]}
              >
                <ThemeIcon size={18} />
              </button>
              {/* Bell + indicateur de notification */}
              <NavLink
                to="/donor/alerts"
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-95"
                style={{ color: "var(--txt-mute)" }}
                aria-label="Alertes"
              >
                <Bell size={18} />
                <span className="absolute top-[10px] right-[10px] w-[6px] h-[6px] rounded-full" style={{ background: "var(--crit)" }} />
              </NavLink>
              {/* Logout */}
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-95"
                style={{ color: "var(--txt-mute)" }}
                aria-label="Se déconnecter"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--crit)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--txt-mute)"; }}
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
            background: "var(--surface)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow-lg)",
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
                  className="flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-95 flex-1 h-14 rounded-full"
                  style={{
                    color: active ? "var(--clinic)" : "var(--txt-mute)",
                  }}
                >
                  <div className="relative">
                    <Icon size={22} strokeWidth={active ? 2.4 : 1.7} />
                    {active && (
                      <div className="absolute -bottom-2 left-1/2 w-1 h-1 rounded-full -translate-x-1/2" style={{ background: "var(--clinic)" }} />
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ opacity: active ? 1 : 0.75 }}
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
