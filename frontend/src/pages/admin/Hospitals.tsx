import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, Input, Modal, Skeleton } from "../../components/ui";

export default function Hospitals() {
  const toast = useToast();
  const hospitals = useApi(() => api.listHospitals(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", localisation: "", type: "Hôpital" });
  const [saving, setSaving] = useState(false);

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Établissements</h1>
        <Button onClick={() => setOpen(true)}>+ Nouvel établissement</Button>
      </div>

      <Card title="Réseau">
        {hospitals.loading ? (
          <Skeleton className="h-40" />
        ) : !hospitals.data?.length ? (
          <EmptyState message="Aucun établissement." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Localité</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {hospitals.data.map((h) => (
                  <tr key={h.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{h.nom}</td>
                    <td className="px-4 py-3 text-slate-500">{h.localisation}</td>
                    <td className="px-4 py-3 text-slate-600">{h.type}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger" onClick={() => remove(h.id)}>Supprimer</Button>
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
