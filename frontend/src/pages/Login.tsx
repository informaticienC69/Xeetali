// Login.tsx — Page de connexion Command Center XÉÉTALI
// Inspiré de maquette.html · Light + Dark · logique inchangée
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet, Eye, EyeOff, Wifi } from "lucide-react";
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
      {/* ── Effets "Waouhh" Command Center ── */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-30 z-0" />
      <div className="absolute inset-0 pointer-events-none gridlines opacity-50 z-0" />
      <div className="absolute inset-0 pointer-events-none holo-shimmer opacity-10 z-0" />
      

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
          {/* Logo */}
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            {/* Glow rings */}
            <span
              className="absolute inset-0 rounded-2xl pulse-soft"
              style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.20)" }}
            />
            <span
              className="absolute inset-3 rounded-xl pulse-soft"
              style={{ background: "rgba(230,57,70,0.08)", animationDelay: "0.7s" }}
            />
            {/* Logo principal */}
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-[1.25rem] backdrop-blur-md"
              style={{
                background: "linear-gradient(135deg, rgba(230,57,70,0.15) 0%, rgba(230,57,70,0.02) 100%)",
                boxShadow: "0 12px 32px rgba(230,57,70,0.2), inset 0 1px 1px rgba(255,255,255,0.1)",
                border: "1px solid rgba(230,57,70,0.3)"
              }}
            >
              <Droplet size={38} strokeWidth={2} className="text-red-500" style={{ fill: "rgba(230,57,70,0.25)", filter: "drop-shadow(0 2px 4px rgba(230,57,70,0.4))" }} />
            </div>
            {/* Point pulsant */}
            <span
              className="absolute -right-1 -top-1 h-3 w-3 rounded-full pulse-soft border-2"
              style={{
                background: "var(--blood)",
                borderColor: "var(--bg)",
                boxShadow: "0 0 10px var(--blood)",
              }}
            />
          </div>

          <h1
            className="syne font-extrabold text-4xl tracking-[0.16em]"
            style={{ color: "var(--blood)" }}
          >
            XÉÉTALI
          </h1>
          <div className="mono text-[10px] uppercase tracking-[0.22em] mt-1" style={{ color: "var(--txt-mute)" }}>
            DÉLIVRANCE · CNTS SN
          </div>
          <p className="mono text-[11px] italic mt-2" style={{ color: "var(--txt-mute)" }}>
            "Joxal sa dërew, mu jox aye dund"
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
                className="rounded-lg px-4 py-3 mono text-[12px]"
                style={{
                  background: "rgba(230,57,70,0.08)",
                  border: "1px solid rgba(230,57,70,0.35)",
                  color: "var(--blood)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-blood w-full py-3 text-sm font-bold"
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={15} /> Connexion en cours…
                </span>
              ) : (
                "SE CONNECTER →"
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
        <div className="mt-4 flex items-center justify-center gap-4 mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
          <span className="flex items-center gap-1.5">
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 9999, background: "var(--ok)", boxShadow: "0 0 8px var(--ok)" }} />
            Hyperledger SYNC
          </span>
          <span className="flex items-center gap-1.5">
            <Wifi size={11} /> LoRaWAN 412
          </span>
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
