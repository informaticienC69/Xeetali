import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { Role } from "../lib/api";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV: Record<Role, NavItem[]> = {
  ADMIN_CNTS: [
    { to: "/admin", label: "Tableau de bord", icon: "📊" },
    { to: "/admin/transfer", label: "Transfert", icon: "🔄" },
    { to: "/admin/campaign", label: "Campagne", icon: "📣" },
    { to: "/admin/users", label: "Utilisateurs", icon: "👤" },
    { to: "/admin/hospitals", label: "Établissements", icon: "🏥" },
  ],
  PERSONNEL_MEDICAL: [
    { to: "/medical", label: "Enregistrer poche", icon: "🩸" },
    { to: "/medical/stock", label: "Stock & recherche", icon: "📦" },
    { to: "/medical/validity", label: "Vérifier validité", icon: "✅" },
    { to: "/medical/request", label: "Demande de sang", icon: "📨" },
  ],
  DONNEUR: [
    { to: "/donor", label: "Mon profil", icon: "🧑" },
    { to: "/donor/points", label: "Points de collecte", icon: "📍" },
    { to: "/donor/appointments", label: "Rendez-vous", icon: "📅" },
    { to: "/donor/alerts", label: "Alertes", icon: "🔔" },
    { to: "/donor/history", label: "Mes dons", icon: "📜" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN_CNTS: "Administrateur CNTS",
  PERSONNEL_MEDICAL: "Personnel Médical",
  DONNEUR: "Donneur",
};

export default function Layout({ children }: { children: ReactNode }) {
  const { role, nom, logout } = useAuth();
  const navigate = useNavigate();
  if (!role) return null;
  const items = NAV[role];

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition " +
    (isActive ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🩸</span>
            <div className="leading-tight">
              <div className="text-lg font-bold text-red-700">Xéétali</div>
              <div className="text-[11px] text-slate-400">CNTS · Node Central</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <div className="font-medium text-slate-700">{nom}</div>
              <div className="text-xs text-slate-400">{ROLE_LABEL[role]}</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Déconnexion
            </button>
          </div>
        </div>
        {/* Nav horizontale scrollable (mobile-first) */}
        <nav className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2">
          <div className="flex gap-1">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end className={linkCls}>
                <span>{it.icon}</span>
                <span className="whitespace-nowrap">{it.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
