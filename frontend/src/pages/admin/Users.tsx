import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError, type Role } from "../../lib/api";
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
  Select,
  Skeleton,
  Toolbar,
} from "../../components/ui";

const ROLES: Role[] = ["ADMIN_CNTS", "PERSONNEL_MEDICAL", "DONNEUR"];

export default function Users() {
  const toast = useToast();
  const users = useApi(() => api.listUsers(), []);
  const hospitals = useApi(() => api.listHospitals(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", email: "", password: "", role: "PERSONNEL_MEDICAL" as Role, hospital_id: "" as number | "" });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (users.data ?? []).filter(
      (u) =>
        (!term || u.nom.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)) &&
        (!roleFilter || u.role === roleFilter),
    );
  }, [users.data, q, roleFilter]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Utilisateurs</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Nouvel utilisateur
        </Button>
      </div>

      <Card title="Comptes" subtitle={users.data ? `${filtered.length} / ${users.data.length}` : undefined}>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Nom ou email…" className="min-w-52 grow sm:grow-0" />
          <FilterSelect value={roleFilter} onChange={setRoleFilter}>
            <option value="">Tous les rôles</option>
            <option value="ADMIN_CNTS">ADMIN_CNTS</option>
            <option value="PERSONNEL_MEDICAL">PERSONNEL_MEDICAL</option>
            <option value="DONNEUR">DONNEUR</option>
          </FilterSelect>
        </Toolbar>
        {users.loading ? (
          <Skeleton className="h-40" />
        ) : !filtered.length ? (
          <EmptyState message="Aucun utilisateur ne correspond." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-slate-600 dark:text-slate-300">
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Rôle</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{u.nom}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.role}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger" onClick={() => remove(u.id)}>
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
