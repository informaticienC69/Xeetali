// Appointments.tsx — Donor · Command Center
import { useState } from "react";
import { Calendar, CalendarDays, Clock } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, Input, Select, Skeleton, StatusBadge, PageHeader } from "../../components/ui";

export default function Appointments() {
  const toast = useToast();
  const points = useApi(() => api.collectionPoints(), []);
  const appts  = useApi(() => api.myAppointments(), []);
  const [point, setPoint] = useState<number | "">("");
  const [date, setDate]   = useState("");
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
    } finally { setSaving(false); }
  }

  const pointName = (id: number) => points.data?.find((p) => p.id === id)?.nom ?? `#${id}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Rendez-vous"
        subtitle="Planning"
        icon={CalendarDays}
      />

      <Card title="Nouveau rendez-vous" subtitle="Choisissez un centre de collecte">
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
          <Button type="submit" loading={saving} className="w-full">
            <Calendar size={15} /> Planifier le rendez-vous
          </Button>
        </form>
      </Card>

      <Card title="Mes rendez-vous" subtitle={appts.data ? `${appts.data.length} planifié(s)` : undefined}>
        {appts.loading ? (
          <Skeleton className="h-24" />
        ) : !appts.data?.length ? (
          <EmptyState message="Aucun rendez-vous planifié." />
        ) : (
          <ul className="space-y-2">
            {appts.data.map((a, idx) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors row-fade-in alert-item"
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)", animationDelay: `${Math.min(idx * 40, 400)}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg"
                       style={{ background: "rgba(230,57,70,0.10)", border: "1px solid rgba(230,57,70,0.25)" }}>
                    <Clock size={14} style={{ color: "var(--blood)" }} />
                  </div>
                  <div>
                    <div className="syne font-semibold text-sm" style={{ color: "var(--txt)" }}>
                      {pointName(a.collection_point_id)}
                    </div>
                    <div className="mono text-[11px]" style={{ color: "var(--txt-mute)" }}>
                      {new Date(a.date).toLocaleString("fr-FR")}
                    </div>
                  </div>
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
