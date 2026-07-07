import { useState } from "react";
import { Download, Droplet } from "lucide-react";
import { api, ApiError, BLOOD_GROUPS, type BloodGroup, type Pouch } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { Button, Card, Field, GroupBadge, Input, Select, StatusBadge, PageHeader } from "../../components/ui";

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function RegisterPouch() {
  const { hospitalId } = useAuth();
  const toast = useToast();
  const inv = useApi(() => api.inventory(), []);
  const [groupe, setGroupe] = useState<BloodGroup>("O+");
  const [hospital, setHospital] = useState<number | "">(hospitalId ?? "");
  const [prelevement, setPrelevement] = useState(todayISO());
  const [peremption, setPeremption] = useState(todayISO(42));
  const [saving, setSaving] = useState(false);
  const [last, setLast] = useState<Pouch | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hospital === "") return toast.error("Sélectionnez un hôpital.");
    setSaving(true);
    try {
      const p = await api.registerPouch({
        groupe_sanguin: groupe,
        hospital_id: hospital,
        date_prelevement: prelevement,
        date_peremption: peremption,
      });
      setLast(p);
      toast.success(`Poche ${p.uid} enregistrée.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  function downloadQr(p: Pouch) {
    const a = document.createElement("a");
    a.href = p.qr_code_b64;
    a.download = `${p.uid}.png`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enregistrer une poche"
        subtitle="Banque de sang"
        icon={Droplet}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Nouvelle poche" subtitle="UID et QR Code générés automatiquement.">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Groupe sanguin">
              <Select value={groupe} onChange={(e) => setGroupe(e.target.value as BloodGroup)}>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </Field>
            <Field label="Hôpital">
              <Select value={hospital} onChange={(e) => setHospital(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">— choisir —</option>
                {inv.data?.map((h) => <option key={h.hospital_id} value={h.hospital_id}>{h.nom}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date prélèvement"><Input type="date" value={prelevement} onChange={(e) => setPrelevement(e.target.value)} /></Field>
              <Field label="Date péremption"><Input type="date" value={peremption} onChange={(e) => setPeremption(e.target.value)} /></Field>
            </div>
            <Button type="submit" loading={saving}>Enregistrer la poche</Button>
          </form>
        </Card>

        <Card title="Dernière poche enregistrée">
          {last ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={last.qr_code_b64} alt={`QR ${last.uid}`} className="h-40 w-40 rounded-lg border border-slate-200 dark:border-slate-800" />
              <div className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{last.uid}</div>
              <div className="flex items-center gap-2">
                <GroupBadge groupe={last.groupe_sanguin} />
                <StatusBadge statut={last.statut} />
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Péremption : {last.date_peremption}</div>
              <Button variant="secondary" onClick={() => downloadQr(last)}>
                <Download size={16} /> Télécharger le QR
              </Button>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
              Enregistrez une poche pour afficher son UID et son QR Code ici.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
