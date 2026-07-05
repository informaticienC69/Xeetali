import { useState, type ComponentType, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  Droplet,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  ScrollText,
  Send,
  User,
  Users,
  X,
  type LucideProps,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import type { Role } from "../lib/api";
import ThemeToggle from "./ThemeToggle";

type Icon = ComponentType<LucideProps>;
interface NavItem {
  to: string;
  label: string;
  icon: Icon;
}

const NAV: Record<Role, NavItem[]> = {
  ADMIN_CNTS: [
    { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/transfer", label: "Transfert", icon: ArrowLeftRight },
    { to: "/admin/campaign", label: "Campagne", icon: Megaphone },
    { to: "/admin/users", label: "Utilisateurs", icon: Users },
    { to: "/admin/hospitals", label: "Établissements", icon: Building2 },
  ],
  PERSONNEL_MEDICAL: [
    { to: "/medical", label: "Enregistrer poche", icon: Droplet },
    { to: "/medical/stock", label: "Stock & recherche", icon: Boxes },
    { to: "/medical/validity", label: "Vérifier validité", icon: BadgeCheck },
    { to: "/medical/request", label: "Demande de sang", icon: Send },
  ],
  DONNEUR: [
    { to: "/donor", label: "Mon profil", icon: User },
    { to: "/donor/points", label: "Points de collecte", icon: MapPin },
    { to: "/donor/appointments", label: "Rendez-vous", icon: CalendarDays },
    { to: "/donor/alerts", label: "Alertes", icon: Bell },
    { to: "/donor/history", label: "Mes dons", icon: ScrollText },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN_CNTS: "Administrateur CNTS",
  PERSONNEL_MEDICAL: "Personnel Médical",
  DONNEUR: "Donneur",
};

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white">
        <Droplet size={20} className="fill-white" />
      </span>
      <div className="leading-tight">
        <div className="text-lg font-bold text-red-700">Xéétali</div>
        <div className="text-[11px] text-slate-400">CNTS · Node Central</div>
      </div>
    </div>
  );
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition " +
    (isActive
      ? "bg-red-600 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800");
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end className={linkCls} onClick={onNavigate}>
          <Icon size={18} className="shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { role, nom, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  if (!role) return null;
  const items = NAV[role];
  const current = items.find((i) => i.to === location.pathname);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const UserFooter = (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-3 dark:border-slate-800">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <User size={16} />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{nom}</div>
          <div className="truncate text-xs text-slate-400 dark:text-slate-500">{ROLE_LABEL[role]}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <ThemeToggle />
        <button
          onClick={onLogout}
          title="Déconnexion"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="px-4 py-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavList items={items} />
        </div>
        {UserFooter}
      </aside>

      {/* Drawer (mobile) */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between px-4 py-4">
              <Brand />
              <button
                onClick={() => setDrawer(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Fermer le menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <NavList items={items} onNavigate={() => setDrawer(false)} />
            </div>
            {UserFooter}
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure (mobile) */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <button
            onClick={() => setDrawer(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{current?.label ?? "Xéétali"}</span>
          <span className="ml-auto"><ThemeToggle /></span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
