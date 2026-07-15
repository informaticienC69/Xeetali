import { type ReactNode } from "react";

// ── DataTable ─────────────────────────────────────────────────────
// caption (sr-only) donne un nom au tableau pour les lecteurs d'écran ;
// scope="col" associe chaque en-tête à sa colonne (WCAG 1.3.1).
export function DataTable<T>({
  caption,
  columns,
  data,
  keyExtractor,
  renderRow,
}: {
  caption: string;
  columns: string[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  renderRow: (item: T, index: number) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
            {columns.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 text-left" style={{ color: "var(--txt-mute)", fontWeight: 500 }}>
                <span className="mono text-[10px] uppercase tracking-[0.12em]">{h}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className="dt-row row-fade-in"
              style={{
                borderBottom: "1px solid var(--line)",
                animationDelay: `${Math.min(index * 40, 400)}ms`
              }}
            >
              {renderRow(item, index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
