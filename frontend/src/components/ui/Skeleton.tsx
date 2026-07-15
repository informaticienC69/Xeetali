// ── Skeleton (shimmer premium) ───────────────────────────────────────────
// aria-hidden : purement décoratif — l'annonce du chargement est portée par
// le <Spinner role="status"> le plus proche, pas par ces blocs vides.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={"rounded-xl shimmer " + className}
    />
  );
}
