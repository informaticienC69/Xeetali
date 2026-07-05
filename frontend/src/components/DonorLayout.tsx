import type { ComponentType, ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Home, LogOut, ScrollText, User, type LucideProps } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";

type Icon = ComponentType<LucideProps>;
const TABS: { to: string; label: string; icon: Icon }[] = [
  { to: "/donor", label: "Accueil", icon: Home },
  { to: "/donor/alerts", label: "Alertes", icon: Bell },
  { to: "/donor/appointments", label: "Rendez-vous", icon: CalendarDays },
  { to: "/donor/history", label: "Mes dons", icon: ScrollText },
  { to: "/donor/profile", label: "Profil", icon: User },
];

// Enveloppe « application mobile » pour l'espace donneur :
// colonne de largeur téléphone (centrée sur desktop) + barre d'onglets en bas.
export default function DonorLayout({ children }: { children: ReactNode }) {
  const { nom, logout } = useAuth();
  const { mode, cycle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const prenom = (nom ?? "").split(" ")[0];
  const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  return (
    <div className="flex min-h-screen justify-center bg-slate-200 dark:bg-slate-950">
      <div className="relative flex w-full max-w-md flex-col bg-slate-50 shadow-xl dark:bg-slate-900">
        {/* App bar */}
        <header className="sticky top-0 z-20 bg-gradient-to-br from-red-600 to-red-700 px-5 pb-5 pt-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs/relaxed text-red-100">Bonjour</p>
              <h1 className="text-xl font-bold">{prenom || "Donneur"} 👋</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={cycle}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label="Changer de thème"
              >
                <ThemeIcon size={17} />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label="Déconnexion"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

        {/* Barre d'onglets (fixée, centrée sur la colonne) */}
        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <ul className="flex items-stretch justify-around px-1 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
            {TABS.map(({ to, label, icon: Icon }) => {
              const active = to === "/donor" ? pathname === "/donor" : pathname.startsWith(to);
              return (
                <li key={to} className="flex-1">
                  <NavLink
                    to={to}
                    end={to === "/donor"}
                    className={
                      "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition active:scale-95 " +
                      (active ? "text-red-600 dark:text-red-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")
                    }
                  >
                    <span className={"flex h-7 w-7 items-center justify-center rounded-full " + (active ? "bg-red-50 dark:bg-red-950/50" : "")}>
                      <Icon size={19} />
                    </span>
                    <span className="truncate">{label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
