// Hospitals.tsx — Command Center
import { useMemo, useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, FilterSelect, Input, Modal, SearchInput, Skeleton, Toolbar, PageHeader, DataTable } from "../../components/ui";

export default function Hospitals() {
  const toast = useToast();
  const hospitals = useApi(() => api.listHospitals(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", localisation: "", type: "Hôpital" });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const types = useMemo(() => Array.from(new Set((hospitals.data ?? []).map((h) => h.type))).sort(), [hospitals.data]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (hospitals.data ?? []).filter(
      (h) => (!term || h.nom.toLowerCase().includes(term) || h.localisation.toLowerCase().includes(term)) &&
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
    } finally { setSaving(false); }
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
      <PageHeader
        title="Établissements"
        subtitle="Réseau hospitalier"
        icon={Building2}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nouvel établissement
          </Button>
        }
      />

      <Card title="Réseau" subtitle={hospitals.data ? `${filtered.length} / ${hospitals.data.length} établissements` : undefined}>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Nom ou localité…" className="min-w-52 grow sm:grow-0" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter}>
            <option value="">Tous les types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>
        </Toolbar>
        {hospitals.loading ? (
          <Skeleton className="h-40" />
        ) : !filtered.length ? (
          <EmptyState message="Aucun établissement ne correspond." />
        ) : (
          <DataTable
            columns={["Nom", "Localité", "Type", ""]}
            data={filtered}
            keyExtractor={(h) => h.id}
            renderRow={(h) => (
              <>
                <td className="px-4 py-3 syne font-semibold text-sm" style={{ color: "var(--txt)" }}>{h.nom}</td>
                <td className="px-4 py-3 mono text-[12px]" style={{ color: "var(--txt-dim)" }}>{h.localisation}</td>
                <td className="px-4 py-3">
                  <span className="mono text-[10px] px-2 py-1 rounded-md border uppercase tracking-wider"
                        style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--txt-mute)" }}>
                    {h.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="danger" onClick={() => remove(h.id)}>
                    <Trash2 size={14} /> Supprimer
                  </Button>
                </td>
              </>
            )}
          />
        )}
      </Card>

      <Modal open={open} title="Nouvel établissement" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field label="Nom"><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></Field>
          <Field label="Localité"><Input value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} required /></Field>
          <Field label="Type"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Créer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
