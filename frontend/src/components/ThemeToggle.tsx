import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "../lib/theme";

const NEXT_LABEL: Record<ThemeMode, string> = {
  light: "Passer en mode sombre",
  dark: "Passer en mode système",
  system: "Passer en mode clair",
};

// Bouton compact qui cycle clair → sombre → système.
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, cycle } = useTheme();
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  return (
    <button
      onClick={cycle}
      title={NEXT_LABEL[mode]}
      aria-label={NEXT_LABEL[mode]}
      className={
        "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 " +
        className
      }
    >
      <Icon size={18} />
    </button>
  );
}
