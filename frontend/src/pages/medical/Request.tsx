import { useState } from "react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, GroupBadge, Input, Select, Skeleton } from "../../components/ui";

const URGENCES = ["NORMALE", "URGENTE", "CRITIQUE"];

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

  const urgenceCls = (u: string) =>
    u === "CRITIQUE" ? "text-red-700 font-semibold" : u === "URGENTE" ? "text-amber-600" : "text-slate-500";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Demande de sang</h1>

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

      <Card title="Demandes récentes">
        {requests.loading ? (
          <Skeleton className="h-24" />
        ) : !requests.data?.length ? (
          <EmptyState message="Aucune demande." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Groupe</th>
                  <th className="px-4 py-3 font-semibold">Quantité</th>
                  <th className="px-4 py-3 font-semibold">Urgence</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {requests.data.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3"><GroupBadge groupe={r.groupe_sanguin} /></td>
                    <td className="px-4 py-3">{r.quantite}</td>
                    <td className={`px-4 py-3 ${urgenceCls(r.urgence)}`}>{r.urgence}</td>
                    <td className="px-4 py-3 text-slate-500">{r.statut}</td>
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
