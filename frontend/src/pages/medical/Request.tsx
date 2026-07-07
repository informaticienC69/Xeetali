import { useMemo, useState } from "react";
import { Syringe } from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import {
  Button,
  Card,
  EmptyState,
  Field,
  FilterSelect,
  GroupBadge,
  Input,
  Select,
  Skeleton,
  Toolbar,
  PageHeader,
  DataTable,
  UrgencyBadge
} from "../../components/ui";

const URGENCES = ["NORMALE", "URGENTE", "CRITIQUE"];
const STATUTS = ["OUVERTE", "SATISFAITE", "ANNULEE"];

export default function Request() {
  const { hospitalId } = useAuth();
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);
  const requests = useApi(() => api.listRequests(), []);
  const [hospital, setHospital] = useState<number | "">(hospitalId ?? "");
  const [groupe, setGroupe] = useState<BloodGroup>("O-");
  const [quantite, setQuantite] = useState(1);
  const [urgence, setUrgence] = useState("URGENTE");
  const [saving, setSaving] = useState(false);
  const [fGroupe, setFGroupe] = useState("");
  const [fUrgence, setFUrgence] = useState("");
  const [fStatut, setFStatut] = useState("");

  const filtered = useMemo(
    () =>
      (requests.data ?? []).filter(
        (r) =>
          (!fGroupe || r.groupe_sanguin === fGroupe) &&
          (!fUrgence || r.urgence === fUrgence) &&
          (!fStatut || r.statut === fStatut),
      ),
    [requests.data, fGroupe, fUrgence, fStatut],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hospital === "") return toast.error("Sélectionnez un hôpital.");
    setSaving(true);
    try {
      await api.createRequest({ hospital_id: hospital, groupe_sanguin: groupe, quantite, urgence });
      toast.success("Demande émise.");
      requests.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demande de sang"
        subtitle="Urgences"
        icon={Syringe}
      />

      <Card title="Émettre une demande">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Hôpital demandeur">
            <Select value={hospital} onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">— choisir —</option>
              {inv.data?.map((h) => <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>)}
            </Select>
          </Field>
          <Field label="Groupe">
            <Select value={groupe} onChange={(e) => setGroupe(e.target.value as BloodGroup)}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Quantité"><Input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="Urgence">
            <Select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
              {URGENCES.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2"><Button type="submit" loading={saving}>Émettre la demande</Button></div>
        </form>
      </Card>

      <Card title="Demandes récentes" subtitle={requests.data ? `${filtered.length} / ${requests.data.length}` : undefined}>
        <Toolbar>
          <FilterSelect value={fGroupe} onChange={setFGroupe}>
            <option value="">Tous groupes</option>
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </FilterSelect>
          <FilterSelect value={fUrgence} onChange={setFUrgence}>
            <option value="">Toutes urgences</option>
            {URGENCES.map((u) => <option key={u} value={u}>{u}</option>)}
          </FilterSelect>
          <FilterSelect value={fStatut} onChange={setFStatut}>
            <option value="">Tous statuts</option>
            {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>
        </Toolbar>
        {requests.loading ? (
          <Skeleton className="h-24" />
        ) : !filtered.length ? (
          <EmptyState message="Aucune demande ne correspond." />
        ) : (
          <DataTable
            columns={["Groupe", "Quantité", "Urgence", "Statut"]}
            data={filtered}
            keyExtractor={(r) => r.id}
            renderRow={(r) => (
              <>
                <td className="px-4 py-3"><GroupBadge groupe={r.groupe_sanguin} /></td>
                <td className="px-4 py-3 syne font-semibold">{r.quantite}</td>
                <td className="px-4 py-3"><UrgencyBadge urgence={r.urgence} /></td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.statut}</td>
              </>
            )}
          />
        )}
      </Card>
    </div>
  );
}
