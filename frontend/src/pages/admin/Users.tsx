// Users.tsx — Command Center
import { useMemo, useState } from "react";
import { Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { api, ApiError, type Role } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, FilterSelect, Input, Modal, SearchInput, Select, Skeleton, Toolbar, PageHeader, DataTable, ConfirmModal } from "../../components/ui";

const ROLES: Role[] = ["ADMIN_CNTS", "PERSONNEL_MEDICAL", "DONNEUR"];
const ROLE_COLOR: Record<Role, string> = {
  ADMIN_CNTS:        "rgba(206,51,65,0.12)",
  PERSONNEL_MEDICAL: "rgba(29,53,87,0.20)",
  DONNEUR:           "rgba(22,163,74,0.10)",
};
const ROLE_BORDER: Record<Role, string> = {
  ADMIN_CNTS:        "rgba(206,51,65,0.35)",
  PERSONNEL_MEDICAL: "rgba(29,53,87,0.40)",
  DONNEUR:           "rgba(22,163,74,0.35)",
};
const ROLE_TEXT: Record<Role, string> = {
  ADMIN_CNTS:        "var(--blood)",
  PERSONNEL_MEDICAL: "var(--txt-dim)",
  DONNEUR:           "var(--ok)",
};
const ROLE_DISPLAY: Record<Role, string> = {
  ADMIN_CNTS:        "Admin CNTS",
  PERSONNEL_MEDICAL: "Personnel Médical",
  DONNEUR:           "Donneur",
};

export default function Users() {
  const toast = useToast();
  const users = useApi(() => api.listUsers(), []);
  const hospitals = useApi(() => api.listHospitals(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", email: "", password: "", role: "PERSONNEL_MEDICAL" as Role, hospital_id: "" as number | "" });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number, nom: string } | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (users.data ?? []).filter(
      (u) => (!term || u.nom.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)) &&
             (!roleFilter || u.role === roleFilter),
    );
  }, [users.data, q, roleFilter]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createUser({ nom: form.nom, email: form.email, password: form.password, role: form.role, hospital_id: form.hospital_id === "" ? null : form.hospital_id });
      toast.success("Utilisateur créé.");
      setOpen(false);
      setForm({ nom: "", email: "", password: "", role: "PERSONNEL_MEDICAL", hospital_id: "" });
      users.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!confirmDelete) return;
    try {
      await api.deleteUser(confirmDelete.id);
      toast.success("Utilisateur supprimé.");
      setConfirmDelete(null);
      users.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes"
        icon={UsersIcon}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nouvel utilisateur
          </Button>
        }
      />

      <Card title="Comptes" subtitle={users.data ? `${filtered.length} / ${users.data.length} utilisateurs` : undefined}>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Nom ou email…" className="min-w-52 grow sm:grow-0" />
          <FilterSelect value={roleFilter} onChange={setRoleFilter}>
            <option value="">Tous les rôles</option>
            <option value="ADMIN_CNTS">ADMIN CNTS</option>
            <option value="PERSONNEL_MEDICAL">Personnel Médical</option>
            <option value="DONNEUR">Donneur</option>
          </FilterSelect>
        </Toolbar>
        {users.loading ? (
          <Skeleton className="h-40" />
        ) : !filtered.length ? (
          <EmptyState message="Aucun utilisateur ne correspond." />
        ) : (
          <DataTable
            columns={["Nom", "Email", "Rôle", ""]}
            data={filtered}
            keyExtractor={(u) => u.id}
            renderRow={(u) => (
              <>
                <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--txt)" }}>{u.nom}</td>
                <td className="px-4 py-3 mono text-[12px]" style={{ color: "var(--txt-dim)" }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="mono text-[10px] px-2 py-1 rounded-md border uppercase tracking-wider"
                        style={{
                          background: ROLE_COLOR[u.role as Role] ?? "var(--surface-2)",
                          borderColor: ROLE_BORDER[u.role as Role] ?? "var(--line)",
                          color: ROLE_TEXT[u.role as Role] ?? "var(--txt-mute)",
                        }}>
                    {ROLE_DISPLAY[u.role as Role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="danger" onClick={() => setConfirmDelete({ id: u.id, nom: u.nom })}>
                    <Trash2 size={14} /> Supprimer
                  </Button>
                </td>
              </>
            )}
          />
        )}
      </Card>

      <Modal open={open} title="Nouvel utilisateur" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field label="Nom"><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Mot de passe (8 car. min.)"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
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
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Créer</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmDelete !== null}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer définitivement le compte "${confirmDelete?.nom}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(null)}
        tone="blood"
      />
    </div>
  );
}
