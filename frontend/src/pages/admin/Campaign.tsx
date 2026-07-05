import { useState } from "react";
import { api, ApiError, BLOOD_GROUPS, type AlertDispatch, type BloodGroup } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button, Card, Field, GroupBadge, Select } from "../../components/ui";

export default function Campaign() {
  const toast = useToast();
  const [groupe, setGroupe] = useState<BloodGroup>("O-");
  const [canal, setCanal] = useState("SMS");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AlertDispatch | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.campaign({ groupe_sanguin: groupe, canal });
      setResult(res);
      toast.success(`Campagne lancée : ${res.donneurs_notifies} donneur(s) notifié(s) (simulation).`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Campagne d'alerte nationale</h1>

      <Card title="Nouvelle campagne" subtitle="Simulation SMS/Push — aucun envoi réel, numéros masqués.">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Groupe recherché">
            <Select value={groupe} onChange={(e) => setGroupe(e.target.value as BloodGroup)}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Canal">
            <Select value={canal} onChange={(e) => setCanal(e.target.value)}>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting}>Lancer la campagne</Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card title="Résultat de la simulation">
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Groupe :</span> <GroupBadge groupe={result.groupe_sanguin} />
              <span className="ml-3 text-slate-500 dark:text-slate-400">Portée :</span> <b>{result.portee}</b>
              <span className="ml-3 text-slate-500 dark:text-slate-400">Canal :</span> <b>{result.canal}</b>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Donneurs compatibles ciblés :</span>{" "}
              <b className="text-red-600">{result.donneurs_notifies}</b>
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Groupes donneurs compatibles :{" "}
              {result.groupes_donneurs_compatibles.map((g) => (
                <span key={g} className="mr-1"><GroupBadge groupe={g} /></span>
              ))}
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{result.message}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Numéros (masqués) : {result.numeros_masques.join(", ") || "—"}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
