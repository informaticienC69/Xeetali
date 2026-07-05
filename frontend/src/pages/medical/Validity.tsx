import { useState } from "react";
import { api, ApiError, type PouchValidity } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button, Card, Input, StatusBadge } from "../../components/ui";

export default function Validity() {
  const toast = useToast();
  const [uid, setUid] = useState("");
  const [result, setResult] = useState<PouchValidity | null>(null);
  const [loading, setLoading] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim()) return;
    setLoading(true);
    try {
      setResult(await api.pouchValidity(uid.trim()));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Vérifier la validité d'une poche</h1>

      <Card title="Recherche par UID" subtitle="Contrôle d'existence en base et de péremption (sans Blockchain).">
        <form onSubmit={check} className="flex flex-wrap items-end gap-3">
          <div className="grow">
            <label className="mb-1 block text-sm font-medium text-slate-600">UID de la poche</label>
            <Input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="XEE-XXXXXXXXXXXX" className="font-mono" />
          </div>
          <Button type="submit" loading={loading}>Vérifier</Button>
        </form>
      </Card>

      {result && (
        <Card title="Résultat">
          <div
            className={
              "rounded-lg border p-4 " +
              (result.valide
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50")
            }
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span>{result.valide ? "✅" : "⛔"}</span>
              <span className={result.valide ? "text-green-800" : "text-red-800"}>
                {result.valide ? "Poche valide et disponible" : "Poche non utilisable"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{result.motif}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div><dt className="text-slate-400">UID</dt><dd className="font-mono">{result.uid}</dd></div>
              <div><dt className="text-slate-400">Existe</dt><dd>{result.existe ? "Oui" : "Non"}</dd></div>
              {result.statut && <div><dt className="text-slate-400">Statut</dt><dd><StatusBadge statut={result.statut} /></dd></div>}
              {result.date_peremption && <div><dt className="text-slate-400">Péremption</dt><dd>{result.date_peremption}</dd></div>}
            </dl>
          </div>
        </Card>
      )}
    </div>
  );
}
