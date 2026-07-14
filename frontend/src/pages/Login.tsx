// Login.tsx — Page de connexion Command Center XÉÉTALI
// Inspiré de maquette.html · Light + Dark · logique inchangée
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet, Eye, EyeOff } from "lucide-react";
import { ApiError, type Role } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { Spinner } from "../components/ui";

const HOME: Record<Role, string> = {
  ADMIN_CNTS:        "/admin",
  PERSONNEL_MEDICAL: "/medical",
  DONNEUR:           "/donor",
};

const DEMO = [
  { label: "Admin CNTS",       email: "admin@cnts.sn",   role: "ADMIN" },
  { label: "Personnel Médical",email: "medecin@cnts.sn", role: "MED"   },
  { label: "Donneur",          email: "donneur@cnts.sn", role: "DON"   },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mode, cycle } = useTheme();
  const [email, setEmail]       = useState("admin@cnts.sn");
  const [password, setPassword] = useState("Password123!");
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const role = await login(email, password);
      navigate(HOME[role]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible. Backend démarré ?");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Fond principal */
    <div
      className="relative flex min-h-screen items-center justify-center p-4 flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* ThemeToggle */}
      <button
        onClick={cycle}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
        style={{ borderColor: "var(--line)", color: "var(--txt-mute)", background: "var(--surface)" }}
        aria-label="Changer de thème"
      >
        <ThemeIcon size={17} />
      </button>

      <div className="relative z-10 w-full max-w-sm">

        {/* ── Hero ── */}
        <div className="mb-8 text-center">
          {/* Logo — pastille sobre */}
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "var(--blood)", boxShadow: "var(--shadow-md)" }}
          >
            <Droplet size={32} strokeWidth={2} style={{ color: "#fff", fill: "rgba(255,255,255,0.25)" }} />
          </div>

          {/* Mot-marque (Syne = branding), un seul É accentué */}
          <h1 className="font-bold text-4xl tracking-[0.06em]">
            <span style={{ color: "var(--txt)" }}>X</span>
            <span style={{ color: "var(--blood)" }}>É</span>
            <span style={{ color: "var(--txt)" }}>ÉTALI</span>
          </h1>
          <div className="mono text-[10px] uppercase tracking-[0.20em] mt-2" style={{ color: "var(--txt-mute)" }}>
            Node Central · CNTS Sénégal
          </div>
          <p className="text-[12px] italic mt-2" style={{ color: "var(--txt-dim)" }}>
            « Joxal sa dërew, mu jox aye dund »
          </p>
        </div>

        {/* ── Formulaire ── */}
        <div className="surface" style={{ padding: 24 }}>
          <div className="mono text-[10px] uppercase tracking-[0.14em] mb-4" style={{ color: "var(--txt-mute)" }}>
            Authentification · Système sécurisé
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <label className="block">
              <div className="mono text-[10px] uppercase tracking-[0.14em] mb-1.5" style={{ color: "var(--txt-mute)" }}>
                Adresse email
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="votre@email.sn"
                className="cc-input"
              />
            </label>

            <label className="block">
              <div className="mono text-[10px] uppercase tracking-[0.14em] mb-1.5" style={{ color: "var(--txt-mute)" }}>
                Mot de passe
              </div>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="cc-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
                  style={{ color: "var(--txt-mute)" }}
                  aria-label={show ? "Masquer" : "Afficher"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-[12px]"
                style={{
                  background: "var(--crit-tint)",
                  color: "var(--crit)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-blood w-full py-3 text-sm font-semibold rounded-xl"
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={15} /> Connexion en cours…
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* ── Comptes démo ── */}
        <div className="surface-2 mt-3" style={{ padding: 16 }}>
          <div className="mono text-[10px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--txt-mute)" }}>
            Comptes de démonstration
          </div>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={() => { setEmail(d.email); setPassword("Password123!"); }}
                className="mono text-[10px] px-3 py-1.5 rounded-lg border uppercase tracking-wider transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--txt-mute)", background: "var(--surface)" }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="mono text-[10px] mt-2" style={{ color: "var(--txt-mute)" }}>
            Mot de passe : <code style={{ color: "var(--txt)" }}>Password123!</code>
          </p>
        </div>

        {/* Statut système */}
        <div className="mt-4 flex items-center justify-center gap-3 mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
          <span className="flex items-center gap-1.5">
            <span className="status-dot" style={{ background: "var(--ok)" }} />
            Système opérationnel
          </span>
          <span>·</span>
          <span>v1.4.0</span>
        </div>
      </div>

      {/* Footer global */}
      <div className="text-center mono text-[10px] py-4 mt-8 shrink-0 relative z-10" style={{ color: "var(--txt-mute)" }}>
        XÉÉTALI · CNTS Sénégal · Données hébergées à Diamniadio · Conforme CDP loi 2008-12
      </div>
    </div>
  );
}
