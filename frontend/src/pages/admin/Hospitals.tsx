import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import {
  Button,
  Card,
  EmptyState,
  Field,
  FilterSelect,
  Input,
  Modal,
  SearchInput,
  Skeleton,
  Toolbar,
} from "../../components/ui";

export default function Hospitals() {
  const toast = useToast();
  const hospitals = useApi(() => api.listHospitals(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", localisation: "", type: "Hôpital" });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const types = useMemo(
    () => Array.from(new Set((hospitals.data ?? []).map((h) => h.type))).sort(),
    [hospitals.data],
  );
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (hospitals.data ?? []).filter(
      (h) =>
        (!term || h.nom.toLowerCase().includes(term) || h.localisation.toLowerCase().includes(term)) &&
        (!typeFilter || h.type === typeFilter),
    );
  }, [hospitals.data, q, typeFilter]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createHospital(form);
      toast.success("Établissement créé.");
      setOpen(false);
      setForm({ nom: "", localisation: "", type: "Hôpital" });
      hospitals.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await api.deleteHospital(id);
      toast.success("Établissement supprimé.");
      hospitals.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Établissements</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Nouvel établissement
        </Button>
      </div>

      <Card title="Réseau" subtitle={hospitals.data ? `${filtered.length} / ${hospitals.data.length}` : undefined}>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Nom ou localité…" className="min-w-52 grow sm:grow-0" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter}>
            <option value="">Tous les types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </FilterSelect>
        </Toolbar>
        {hospitals.loading ? (
          <Skeleton className="h-40" />
        ) : !filtered.length ? (
          <EmptyState message="Aucun établissement ne correspond." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-slate-600 dark:text-slate-300">
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Localité</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{h.nom}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{h.localisation}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{h.type}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger" onClick={() => remove(h.id)}>
                        <Trash2 size={15} /> Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} title="Nouvel établissement" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field label="Nom"><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></Field>
          <Field label="Localité"><Input value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} required /></Field>
          <Field label="Type"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Créer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
