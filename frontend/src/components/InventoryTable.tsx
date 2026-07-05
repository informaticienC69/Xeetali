import { BLOOD_GROUPS, type HospitalInventory } from "../api";

interface Props {
  inventory: HospitalInventory[];
}

// Tableau croisé : une ligne par hôpital, une colonne par groupe sanguin.
export default function InventoryTable({ inventory }: Props) {
  const quantiteFor = (h: HospitalInventory, groupe: string): number =>
    h.stocks.find((s) => s.groupe_sanguin === groupe)?.quantite ?? 0;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-600">
            <th className="px-4 py-3 font-semibold">Hôpital</th>
            <th className="px-4 py-3 font-semibold">Localisation</th>
            {BLOOD_GROUPS.map((g) => (
              <th key={g} className="px-3 py-3 text-center font-semibold">
                {g}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inventory.map((h) => (
            <tr key={h.hospital_id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{h.nom}</td>
              <td className="px-4 py-3 text-slate-500">{h.localisation}</td>
              {BLOOD_GROUPS.map((g) => {
                const q = quantiteFor(h, g);
                return (
                  <td key={g} className="px-3 py-3 text-center">
                    <span
                      className={
                        q === 0
                          ? "text-slate-300"
                          : q < 5
                            ? "font-semibold text-amber-600"
                            : "text-slate-700"
                      }
                    >
                      {q}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
