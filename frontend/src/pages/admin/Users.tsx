import { useState } from "react";
import { api, ApiError, type Role } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, Input, Modal, Select, Skeleton } from "../../components/ui";

const ROLES: Role[] = ["ADMIN_CNTS", "PERSONNEL_MEDICAL", "DONNEUR"];

export default function Users() {
  const toast = useToast();
  const users = useApi(() => api.listUsers(), []);
  const hospitals = useApi(() => api.listHospitals(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", email: "", password: "", role: "PERSONNEL_MEDICAL" as Role, hospital_id: "" as number | "" });
  const [saving, setSaving] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createUser({
        nom: form.nom,
        email: form.email,
        password: form.password,
        role: form.role,
        hospital_id: form.hospital_id === "" ? null : form.hospital_id,
      });
      toast.success("Utilisateur créé.");
      setOpen(false);
      setForm({ nom: "", email: "", password: "", role: "PERSONNEL_MEDICAL", hospital_id: "" });
      users.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await api.deleteUser(id);
      toast.success("Utilisateur supprimé.");
      users.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Utilisateurs</h1>
        <Button onClick={() => setOpen(true)}>+ Nouvel utilisateur</Button>
      </div>

      <Card title="Comptes">
        {users.loading ? (
          <Skeleton className="h-40" />
        ) : !users.data?.length ? (
          <EmptyState message="Aucun utilisateur." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Rôle</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.nom}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.role}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger" onClick={() => remove(u.id)}>Supprimer</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} title="Nouvel utilisateur" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field label="Nom"><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Mot de passe" hint="8 caractères minimum">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </Field>
          <Field label="Rôle">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Hôpital (optionnel)">
            <Select value={form.hospital_id} onChange={(e) => setForm({ ...form, hospital_id: e.target.value === "" ? "" : Number(e.target.value) })}>
              <option value="">— aucun —</option>
              {hospitals.data?.map((h) => <option key={h.id} value={h.id}>{h.nom}</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Créer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
