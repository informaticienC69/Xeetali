import { useState } from "react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, Field, Input, Select, Skeleton } from "../../components/ui";
import InventoryTable from "../../components/InventoryTable";

export default function Transfer() {
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);
  const [source, setSource] = useState<number | "">("");
  const [target, setTarget] = useState<number | "">("");
  const [groupe, setGroupe] = useState<BloodGroup>("O+");
  const [quantite, setQuantite] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const hospitals = inv.data ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (source === "" || target === "") return toast.error("Sélectionnez source et cible.");
    if (source === target) return toast.error("La source et la cible doivent différer.");
    setSubmitting(true);
    try {
      const res = await api.transfer({
        source_hospital_id: source,
        target_hospital_id: target,
        groupe_sanguin: groupe,
        quantite,
      });
      toast.success(`Transfert #${res.id} ${res.statut} : ${res.quantite} poche(s) ${res.groupe_sanguin}.`);
      inv.reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) toast.error(`Stock insuffisant : ${err.message}`);
      else toast.error(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Coordonner un transfert (UC-04)</h1>

      <Card title="Nouvel ordre de transfert" subtitle="Réaffecte N poches disponibles d'un hôpital à un autre (atomique).">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Hôpital source">
            <Select value={source} onChange={(e) => setSource(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">— choisir —</option>
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
              ))}
            </Select>
          </Field>
          <Field label="Hôpital cible">
            <Select value={target} onChange={(e) => setTarget(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">— choisir —</option>
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>
              ))}
            </Select>
          </Field>
          <Field label="Groupe sanguin">
            <Select value={groupe} onChange={(e) => setGroupe(e.target.value as BloodGroup)}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Quantité (poches)">
            <Input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Math.max(1, Number(e.target.value)))} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting}>Valider le transfert</Button>
          </div>
        </form>
      </Card>

      <Card title="Stocks actuels">
        {inv.loading ? <Skeleton className="h-40" /> : <InventoryTable inventory={hospitals} />}
      </Card>
    </div>
  );
}
