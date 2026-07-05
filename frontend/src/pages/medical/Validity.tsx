import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
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
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Vérifier la validité d'une poche</h1>

      <Card title="Recherche par UID" subtitle="Contrôle d'existence en base et de péremption (sans Blockchain).">
        <form onSubmit={check} className="flex flex-wrap items-end gap-3">
          <div className="grow">
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">UID de la poche</label>
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
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40")
            }
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              {result.valide ? (
                <CheckCircle2 size={22} className="text-green-600 dark:text-green-400" />
              ) : (
                <XCircle size={22} className="text-red-600 dark:text-red-400" />
              )}
              <span className={result.valide ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}>
                {result.valide ? "Poche valide et disponible" : "Poche non utilisable"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{result.motif}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div><dt className="text-slate-400 dark:text-slate-500">UID</dt><dd className="font-mono">{result.uid}</dd></div>
              <div><dt className="text-slate-400 dark:text-slate-500">Existe</dt><dd>{result.existe ? "Oui" : "Non"}</dd></div>
              {result.statut && <div><dt className="text-slate-400 dark:text-slate-500">Statut</dt><dd><StatusBadge statut={result.statut} /></dd></div>}
              {result.date_peremption && <div><dt className="text-slate-400 dark:text-slate-500">Péremption</dt><dd>{result.date_peremption}</dd></div>}
            </dl>
          </div>
        </Card>
      )}
    </div>
  );
}
