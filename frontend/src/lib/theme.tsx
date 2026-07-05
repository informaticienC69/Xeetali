import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const KEY = "xeetali_theme";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: Resolved;
  setMode: (m: ThemeMode) => void;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(mode: ThemeMode): Resolved {
  const resolved: Resolved = mode === "system" ? (systemDark() ? "dark" : "light") : mode;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(
    () => (localStorage.getItem(KEY) as ThemeMode) || "system",
  );
  const [resolved, setResolved] = useState<Resolved>(() => apply(mode));

  const setMode = useCallback((m: ThemeMode) => {
    localStorage.setItem(KEY, m);
    setModeState(m);
    setResolved(apply(m));
  }, []);

  const cycle = useCallback(() => {
    setMode(mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
  }, [mode, setMode]);

  // Suivre le système quand le mode est "system".
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode, cycle }),
    [mode, resolved, setMode, cycle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  return ctx;
}
