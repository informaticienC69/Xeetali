import { useEffect, useState } from "react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button, Card, Field, Input, Select, Skeleton } from "../../components/ui";

export default function Profile() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    groupe_sanguin: "O+" as BloodGroup,
    telephone: "",
    localisation: "",
    date_dernier_don: "",
  });
  const [exists, setExists] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.myProfile();
        setForm({
          groupe_sanguin: p.groupe_sanguin,
          telephone: p.telephone,
          localisation: p.localisation,
          date_dernier_don: p.date_dernier_don ?? "",
        });
        setExists(true);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) toast.error("Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.upsertProfile({
        groupe_sanguin: form.groupe_sanguin,
        telephone: form.telephone,
        localisation: form.localisation,
        date_dernier_don: form.date_dernier_don || null,
      });
      toast.success("Profil enregistré.");
      setExists(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mon profil donneur</h1>
      <Card title={exists ? "Mettre à jour mes informations" : "Compléter mon profil (UC-14)"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Groupe sanguin">
            <Select value={form.groupe_sanguin} onChange={(e) => setForm({ ...form, groupe_sanguin: e.target.value as BloodGroup })}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Téléphone" hint="Confidentiel — jamais affiché en clair côté CNTS.">
            <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} required />
          </Field>
          <Field label="Localité"><Input value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} required /></Field>
          <Field label="Date du dernier don (optionnel)">
            <Input type="date" value={form.date_dernier_don} onChange={(e) => setForm({ ...form, date_dernier_don: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving} className="w-full">Enregistrer</Button>
        </form>
      </Card>
    </div>
  );
}
