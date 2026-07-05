import { useMemo, useState } from "react";
import { BLOOD_GROUPS, type HospitalInventory } from "../lib/api";
import { Input } from "./ui";

interface Props {
  inventory: HospitalInventory[];
}

// Tableau croisé hôpital × groupe sanguin, avec filtre par nom/localité et tri.
export default function InventoryTable({ inventory }: Props) {
  const [filter, setFilter] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const quantiteFor = (h: HospitalInventory, groupe: string): number =>
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
        <Input
          placeholder="Filtrer par hôpital ou localité…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <button
          onClick={() => setSortAsc((s) => !s)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Tri par stock total {sortAsc ? "▼" : "▲"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <th className="px-4 py-3 font-semibold">Hôpital</th>
              <th className="px-4 py-3 font-semibold">Localité</th>
              {BLOOD_GROUPS.map((g) => (
                <th key={g} className="px-3 py-3 text-center font-semibold">{g}</th>
              ))}
              <th className="px-3 py-3 text-center font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.hospital_id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{h.nom}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{h.localisation}</td>
                {BLOOD_GROUPS.map((g) => {
                  const q = quantiteFor(h, g);
                  return (
                    <td key={g} className="px-3 py-3 text-center">
                      <span className={q === 0 ? "text-slate-300 dark:text-slate-600" : q < 5 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}>
                        {q}
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">{total(h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
