import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet, Eye, EyeOff } from "lucide-react";
import { ApiError, type Role } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button, Input } from "../components/ui";
import ThemeToggle from "../components/ThemeToggle";

const HOME: Record<Role, string> = {
  ADMIN_CNTS: "/admin",
  PERSONNEL_MEDICAL: "/medical",
  DONNEUR: "/donor",
};

const DEMO = [
  { label: "Admin CNTS", email: "admin@cnts.sn" },
  { label: "Personnel Médical", email: "medecin@cnts.sn" },
  { label: "Donneur", email: "donneur@cnts.sn" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@cnts.sn");
  const [password, setPassword] = useState("Password123!");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
            <Droplet size={28} className="fill-white" />
          </span>
          <h1 className="mt-3 text-2xl font-bold text-red-700 dark:text-red-400">Xéétali</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestion des stocks de sang · CNTS Sénégal</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Mot de passe</span>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</div>}

          <Button type="submit" loading={loading} className="w-full">
            Se connecter
          </Button>
        </form>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white/60 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
          <p className="mb-2 font-medium text-slate-600 dark:text-slate-300">Comptes de démonstration</p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={() => {
                  setEmail(d.email);
                  setPassword("Password123!");
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Mot de passe commun : Password123!</p>
        </div>
      </div>
    </div>
  );
}
