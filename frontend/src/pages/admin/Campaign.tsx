// Campaign.tsx — Alerte Nationale Command Center
import { useState } from "react";
import { Bell, Megaphone } from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type AlertDispatch, type BloodGroup } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button, Card, Field, GroupBadge, Select, PageHeader } from "../../components/ui";

export default function Campaign() {
  const toast = useToast();
  const [groupe, setGroupe] = useState<BloodGroup>("O-");
  const [canal, setCanal]   = useState("SMS");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AlertDispatch | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.campaign({ groupe_sanguin: groupe, canal });
      setResult(res);
      toast.success(`Campagne lancée : ${res.donneurs_notifies} donneur(s) notifié(s).`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campagne d'alerte nationale"
        subtitle="Système d'alerte"
        icon={Megaphone}
      />

      <Card title="Nouvelle campagne" subtitle="Simulation SMS/Push — aucun envoi réel, numéros masqués.">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Groupe recherché">
            <Select value={groupe} onChange={(e) => setGroupe(e.target.value as BloodGroup)}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Canal de diffusion">
            <Select value={canal} onChange={(e) => setCanal(e.target.value)}>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push notification</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting} className={!submitting ? "pulse-blood" : ""}>
              <Bell size={16} /> Lancer la campagne
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card title="Résultat de la simulation" subtitle="Campagne exécutée">
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 surface-2 rounded-lg px-3 py-2">
                <span className="mono text-[10px] uppercase" style={{ color: "var(--txt-mute)" }}>Groupe :</span>
                <GroupBadge groupe={result.groupe_sanguin} />
              </div>
              <div className="flex items-center gap-2 surface-2 rounded-lg px-3 py-2">
                <span className="mono text-[10px] uppercase" style={{ color: "var(--txt-mute)" }}>Portée :</span>
                <span className="syne font-bold" style={{ color: "var(--txt)" }}>{result.portee}</span>
              </div>
              <div className="flex items-center gap-2 surface-2 rounded-lg px-3 py-2">
                <span className="mono text-[10px] uppercase" style={{ color: "var(--txt-mute)" }}>Canal :</span>
                <span className="syne font-bold" style={{ color: "var(--txt)" }}>{result.canal}</span>
              </div>
            </div>
            <div className="rounded-xl px-4 py-3"
                 style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.25)" }}>
              <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Donneurs notifiés : </span>
              <span className="syne font-extrabold text-xl" style={{ color: "var(--blood)" }}>{result.donneurs_notifies}</span>
            </div>
            <div>
              <span className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>Groupes compatibles :{" "}</span>
              <span className="inline-flex flex-wrap gap-1 mt-1">
                {result.groupes_donneurs_compatibles.map((g) => <GroupBadge key={g} groupe={g} />)}
              </span>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: "var(--surface-2)" }}>
              <p className="mono text-[12px]" style={{ color: "var(--txt-dim)" }}>{result.message}</p>
            </div>
            <div className="mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
              Numéros masqués : {result.numeros_masques.join(", ") || "—"}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
