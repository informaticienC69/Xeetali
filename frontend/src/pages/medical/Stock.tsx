import { useState } from "react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup, type Pouch, type PouchStatus } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, GroupBadge, Select, Skeleton, StatusBadge } from "../../components/ui";

const STATUSES: PouchStatus[] = ["DISPONIBLE", "RESERVEE", "UTILISEE", "PERIMEE"];

export default function Stock() {
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);
  const [groupe, setGroupe] = useState<BloodGroup | "">("");
  const [hospital, setHospital] = useState<number | "">("");
  const [statut, setStatut] = useState<PouchStatus | "">("DISPONIBLE");
  const [results, setResults] = useState<Pouch[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    try {
      const r = await api.searchPouches({
        groupe_sanguin: groupe || undefined,
        hospital_id: hospital === "" ? undefined : hospital,
        statut: statut || undefined,
      });
      setResults(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(uid: string, s: PouchStatus) {
    try {
      await api.updatePouchStatus(uid, s);
      toast.success(`Poche ${uid} → ${s}.`);
      search();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Stock & recherche d'urgence</h1>

      <Card title="Rechercher des poches">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field label="Groupe">
            <Select value={groupe} onChange={(e) => setGroupe(e.target.value as BloodGroup | "")}>
              <option value="">Tous</option>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Hôpital">
            <Select value={hospital} onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">Tous</option>
              {inv.data?.map((h) => <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>)}
            </Select>
          </Field>
          <Field label="Statut">
            <Select value={statut} onChange={(e) => setStatut(e.target.value as PouchStatus | "")}>
              <option value="">Tous</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button onClick={search} loading={loading} className="w-full">Rechercher</Button>
          </div>
        </div>
      </Card>

      <Card title="Résultats" subtitle={results ? `${results.length} poche(s)` : undefined}>
        {loading ? (
          <Skeleton className="h-40" />
        ) : !results ? (
          <EmptyState message="Lancez une recherche pour afficher les poches." />
        ) : results.length === 0 ? (
          <EmptyState message="Aucune poche ne correspond." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">UID</th>
                  <th className="px-4 py-3 font-semibold">Groupe</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Péremption</th>
                  <th className="px-4 py-3 font-semibold">Changer statut</th>
                </tr>
              </thead>
              <tbody>
                {results.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.uid}</td>
                    <td className="px-4 py-3"><GroupBadge groupe={p.groupe_sanguin} /></td>
                    <td className="px-4 py-3"><StatusBadge statut={p.statut} /></td>
                    <td className="px-4 py-3 text-slate-500">{p.date_peremption}</td>
                    <td className="px-4 py-3">
                      <Select value={p.statut} onChange={(e) => changeStatus(p.uid, e.target.value as PouchStatus)} className="max-w-40">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
