// Hospitals.tsx — Command Center
import { useMemo, useState } from "react";
import { Building2, Plus, Trash2, MapPin, Activity } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { useToast } from "../../lib/toast";
import { Button, Card, EmptyState, Field, FilterSelect, Input, Modal, SearchInput, Select, Skeleton, Toolbar, PageHeader, ConfirmModal } from "../../components/ui";

export default function Hospitals() {
  const toast = useToast();
  const hospitals = useApi(() => api.listHospitals(), []);
  const regions = useApi(() => api.listRegions(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", region_id: "", type: "Hôpital" });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number, nom: string } | null>(null);

  const types = useMemo(() => Array.from(new Set((hospitals.data ?? []).map((h) => h.type))).sort(), [hospitals.data]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (hospitals.data ?? []).filter(
      (h) => (!term || h.nom.toLowerCase().includes(term) || h.region.nom.toLowerCase().includes(term)) &&
             (!typeFilter || h.type === typeFilter),
    );
  }, [hospitals.data, q, typeFilter]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.region_id) return;
    setSaving(true);
    try {
      await api.createHospital({ nom: form.nom, region_id: Number(form.region_id), type: form.type });
      toast.success("Établissement créé.");
      setOpen(false);
      setForm({ nom: "", region_id: "", type: "Hôpital" });
      hospitals.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!confirmDelete) return;
    try {
      await api.deleteHospital(confirmDelete.id);
      toast.success("Établissement supprimé.");
      setConfirmDelete(null);
      hospitals.reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Établissements"
        subtitle="Réseau hospitalier"
        icon={Building2}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nouvel établissement
          </Button>
        }
      />

      <Card title="Réseau" subtitle={hospitals.data ? `${filtered.length} / ${hospitals.data.length} établissements` : undefined}>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Nom ou localité…" className="min-w-52 grow sm:grow-0" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter}>
            <option value="">Tous les types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>
        </Toolbar>
        {hospitals.loading ? (
          <Skeleton className="h-40" />
        ) : !filtered.length ? (
          <EmptyState message="Aucun établissement ne correspond." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-4">
            {filtered.map((h) => (
              <div 
                key={h.id} 
                className="relative p-5 rounded-2xl border"
                style={{ 
                  background: "var(--surface)", 
                  borderColor: "color-mix(in srgb, var(--line) 60%, transparent)", 
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.05)" 
                }}
              >
                <div className="relative z-10 flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="relative flex items-center justify-center w-12 h-12 rounded-xl" 
                           style={{ background: "color-mix(in srgb, var(--blood) 8%, transparent)", color: "var(--blood)", border: "1px solid color-mix(in srgb, var(--blood) 20%, transparent)" }}>
                        <Building2 size={22} strokeWidth={1.5} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="mono text-[9px] uppercase tracking-wider opacity-50" style={{ color: "var(--txt-mute)" }}>ID-{String(h.id).padStart(4, '0')}</span>
                      </div>
                      <h3 className="font-bold text-[15px] tracking-wide leading-tight" style={{ color: "var(--txt)" }}>{h.nom}</h3>
                      <div className="flex items-center gap-1.5 mono text-[10px] mt-1.5 uppercase tracking-wider" style={{ color: "var(--txt-mute)" }}>
                        <MapPin size={12} strokeWidth={1.5} className="opacity-70" /> {h.region.nom}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative h-px w-full my-4" style={{ background: "linear-gradient(90deg, var(--line) 0%, transparent 100%)" }}>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-px bg-red-500/50" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="mono text-[9px] px-3 py-1.5 rounded-lg border uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5"
                          style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--txt-dim)", fontWeight: 500 }}>
                      <Activity size={10} className="opacity-40" />
                      {h.type}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setConfirmDelete({ id: h.id, nom: h.nom })}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105 active:scale-95 group/btn"
                    style={{ 
                      background: "color-mix(in srgb, var(--blood) 6%, transparent)",
                      color: "color-mix(in srgb, var(--blood) 70%, var(--txt))", 
                      border: "1px solid color-mix(in srgb, var(--blood) 15%, transparent)" 
                    }}
                    title="Supprimer l'établissement"
                  >
                    <Trash2 size={15} strokeWidth={1.5} className="transition-colors group-hover/btn:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} title="Nouvel établissement" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field label="Nom"><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></Field>
          <Field label="Région">
            <Select value={form.region_id} onChange={(e) => setForm({ ...form, region_id: e.target.value })} required>
              <option value="" disabled>Sélectionner une région…</option>
              {(regions.data ?? []).map((r) => <option key={r.id} value={String(r.id)}>{r.nom}</option>)}
            </Select>
          </Field>
          <Field label="Type"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Créer</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmDelete !== null}
        title="Supprimer l'établissement"
        description={`Êtes-vous sûr de vouloir supprimer définitivement l'établissement "${confirmDelete?.nom}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(null)}
        tone="blood"
      />
    </div>
  );
}
