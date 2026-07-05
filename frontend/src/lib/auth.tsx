import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler, tokenStore, type Role, type TokenResponse } from "./api";

interface AuthState {
  token: string | null;
  role: Role | null;
  nom: string | null;
  userId: number | null;
  hospitalId: number | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<Role>;
  logout: () => void;
  isAuthenticated: boolean;
}

const SESSION_KEY = "xeetali_session";

function loadSession(): AuthState {
  const token = tokenStore.get();
  const raw = localStorage.getItem(SESSION_KEY);
  if (token && raw) {
    try {
      const s = JSON.parse(raw) as Omit<AuthState, "token">;
      return { token, ...s };
    } catch {
      /* ignore */
    }
  }
  return { token: null, role: null, nom: null, userId: null, hospitalId: null };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadSession);

  const applyToken = useCallback((t: TokenResponse) => {
    tokenStore.set(t.access_token);
    const session: AuthState = {
      token: t.access_token,
      role: t.role,
      nom: t.nom,
      userId: t.user_id,
      hospitalId: t.hospital_id,
    };
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ role: t.role, nom: t.nom, userId: t.user_id, hospitalId: t.hospital_id }),
    );
    setState(session);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const t = await api.login(email, password);
      applyToken(t);
      return t.role;
    },
    [applyToken],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(SESSION_KEY);
    setState({ token: null, role: null, nom: null, userId: null, hospitalId: null });
  }, []);

  // Un 401 sur une route protégée (token expiré) déconnecte automatiquement.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (tokenStore.get()) logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, isAuthenticated: !!state.token }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
