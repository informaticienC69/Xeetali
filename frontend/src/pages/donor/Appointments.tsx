import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, Input, Select, Skeleton, StatusBadge } from "../../components/ui";

export default function Appointments() {
  const toast = useToast();
  const points = useApi(() => api.collectionPoints(), []);
  const appts = useApi(() => api.myAppointments(), []);
  const [point, setPoint] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (point === "" || !date) return toast.error("Choisissez un point et une date.");
    setSaving(true);
    try {
      await api.createAppointment({ collection_point_id: point, date: new Date(date).toISOString() });
      toast.success("Rendez-vous planifié.");
      appts.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  const pointName = (id: number) => points.data?.find((p) => p.id === id)?.nom ?? `#${id}`;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Prendre rendez-vous (UC-16)</h1>

      <Card title="Nouveau rendez-vous">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Point de collecte">
            <Select value={point} onChange={(e) => setPoint(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">— choisir —</option>
              {points.data?.map((p) => <option key={p.id} value={p.id}>{p.nom} — {p.localisation}</option>)}
            </Select>
          </Field>
          <Field label="Date et heure">
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Button type="submit" loading={saving} className="w-full">Planifier</Button>
        </form>
      </Card>

      <Card title="Mes rendez-vous">
        {appts.loading ? (
          <Skeleton className="h-24" />
        ) : !appts.data?.length ? (
          <EmptyState message="Aucun rendez-vous planifié." />
        ) : (
          <ul className="space-y-2">
            {appts.data.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium text-slate-700">{pointName(a.collection_point_id)}</div>
                  <div className="text-xs text-slate-400">{new Date(a.date).toLocaleString("fr-FR")}</div>
                </div>
                <StatusBadge statut={a.statut} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
