// Profile.tsx — Donor · Command Center
import { useEffect, useState } from "react";
import { ShieldCheck, User } from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button, Card, Field, GroupBadge, Input, Select, Skeleton, PageHeader } from "../../components/ui";

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
        setForm({ groupe_sanguin: p.groupe_sanguin, telephone: p.telephone, localisation: p.localisation, date_dernier_don: p.date_dernier_don ?? "" });
        setExists(true);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) toast.error("Erreur de chargement.");
      } finally { setLoading(false); }
    })();
  }, [toast]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.upsertProfile({ groupe_sanguin: form.groupe_sanguin, telephone: form.telephone, localisation: form.localisation, date_dernier_don: form.date_dernier_don || null });
      toast.success("Profil enregistré.");
      setExists(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally { setSaving(false); }
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mon profil donneur"
        subtitle="Informations"
        icon={User}
      />

      {/* Groupe sanguin actuel */}
      {exists && (
        <div
          className="card-in flex items-center gap-4 rounded-xl px-4 py-3"
          style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg"
               style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.35)" }}>
            <ShieldCheck size={18} style={{ color: "var(--blood)" }} />
          </div>
          <div className="flex-1">
            <div className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Groupe sanguin enregistré</div>
            <div className="flex items-center gap-2 mt-0.5">
              <GroupBadge groupe={form.groupe_sanguin} />
              <span className="mono text-[11px]" style={{ color: "var(--txt-mute)" }}>· {form.localisation || "—"}</span>
            </div>
          </div>
        </div>
      )}

      <Card
        title={exists ? "Mettre à jour mes informations" : "Compléter mon profil"}
        subtitle={!exists ? "Première configuration requise" : undefined}
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Groupe sanguin">
            <Select value={form.groupe_sanguin} onChange={(e) => setForm({ ...form, groupe_sanguin: e.target.value as BloodGroup })}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Téléphone">
            <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} required placeholder="+221 XX XXX XX XX" />
            <p className="mono text-[10px] mt-1" style={{ color: "var(--txt-mute)" }}>Confidentiel — jamais affiché en clair côté CNTS.</p>
          </Field>
          <Field label="Localité">
            <Input value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} required placeholder="Dakar, Thiès…" />
          </Field>
          <Field label="Date du dernier don (optionnel)">
            <Input type="date" value={form.date_dernier_don} onChange={(e) => setForm({ ...form, date_dernier_don: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving} className="w-full">
            Enregistrer le profil
          </Button>
        </form>
      </Card>
    </div>
  );
}
