// ── Spinner ───────────────────────────────────────────────────────
// role="status" : annonce l'état de chargement aux lecteurs d'écran, y
// compris quand le spinner est utilisé seul (ex. fallback de route dans
// App.tsx) sans texte visible à proximité pour porter l'information.
export function Spinner({ size = 18, label = "Chargement…" }: { size?: number; label?: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5}
      className="animate-spin"
      style={{ transformOrigin: "center" }}
      role="status"
      aria-label={label}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
