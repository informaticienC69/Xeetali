import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, type Role } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button, Input } from "../components/ui";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl">🩸</div>
          <h1 className="mt-2 text-2xl font-bold text-red-700">Xéétali</h1>
          <p className="text-sm text-slate-500">Gestion des stocks de sang · CNTS Sénégal</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Mot de passe</span>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <Button type="submit" loading={loading} className="w-full">
            Se connecter
          </Button>
        </form>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white/60 p-4 text-sm">
          <p className="mb-2 font-medium text-slate-600">Comptes de démonstration</p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={() => {
                  setEmail(d.email);
                  setPassword("Password123!");
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Mot de passe commun : Password123!</p>
        </div>
      </div>
    </div>
  );
}
