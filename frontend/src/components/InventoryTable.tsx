// InventoryTable.tsx — Command Center · Tableau croisé hôpital × groupe sanguin
import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { BLOOD_GROUPS, type HospitalInventory } from "../lib/api";
import { Input } from "./ui";

interface Props { inventory: HospitalInventory[]; }

export default function InventoryTable({ inventory }: Props) {
  const [filter, setFilter] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const quantiteFor = (h: HospitalInventory, groupe: string) =>
    h.stocks.find((s) => s.groupe_sanguin === groupe)?.quantite ?? 0;
  const total = (h: HospitalInventory) => h.stocks.reduce((a, s) => a + s.quantite, 0);

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const filtered = inventory.filter(
      (h) => !f || h.nom.toLowerCase().includes(f) || h.localisation.toLowerCase().includes(f),
    );
    return [...filtered].sort((a, b) => (sortAsc ? total(b) - total(a) : total(a) - total(b)));
  }, [inventory, filter, sortAsc]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Filtrer par hôpital ou localité…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
        <button
          onClick={() => setSortAsc((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 mono text-[11px] uppercase tracking-wider transition-colors"
          style={{ borderColor: "var(--line)", color: "var(--txt-mute)", background: "var(--surface-2)" }}
        >
          <ArrowDownUp size={12} />
          Stock total {sortAsc ? "▼" : "▲"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--line)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
              <th className="px-4 py-3 text-left">
                <span className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--txt-mute)" }}>Hôpital</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--txt-mute)" }}>Localité</span>
              </th>
              {BLOOD_GROUPS.map((g) => (
                <th key={g} className="px-2 py-3 text-center">
                  <span className="mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: "var(--blood)", background: "rgba(230,57,70,0.10)" }}>{g}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center">
                <span className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--txt-mute)" }}>Total</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr
                key={h.hospital_id}
                style={{ borderBottom: "1px solid var(--line)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <td className="px-4 py-3 syne font-semibold text-sm" style={{ color: "var(--txt)" }}>{h.nom}</td>
                <td className="px-4 py-3 mono text-[11px]" style={{ color: "var(--txt-mute)" }}>{h.localisation}</td>
                {BLOOD_GROUPS.map((g) => {
                  const q = quantiteFor(h, g);
                  return (
                    <td key={g} className="px-2 py-3 text-center mono text-[12px] tabular-nums">
                      <span style={{ color: q === 0 ? "var(--txt-mute)" : q < 5 ? "var(--warn)" : "var(--ok)", fontWeight: q > 0 ? 600 : 400 }}>
                        {q}
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center mono font-bold tabular-nums" style={{ color: "var(--txt)" }}>{total(h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
