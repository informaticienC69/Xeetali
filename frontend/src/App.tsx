import { useCallback, useEffect, useState } from "react";
import { fetchInventory, type HospitalInventory } from "./api";
import InventoryTable from "./components/InventoryTable";
import TransferForm from "./components/TransferForm";

export default function App() {
  const [inventory, setInventory] = useState<HospitalInventory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setInventory(await fetchInventory());
      setError(null);
    } catch {
      setError("Impossible de charger les stocks. Le backend est-il démarré sur le port 8000 ?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-2xl font-bold text-red-700">Xéétali — Node Central</h1>
          <p className="text-sm text-slate-500">
            Gestion des stocks de sang · CNTS Sénégal · Visibilité & transferts inter-hôpitaux
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">État des stocks par hôpital</h2>
          {loading ? (
            <p className="text-slate-500">Chargement…</p>
          ) : (
            <InventoryTable inventory={inventory} />
          )}
        </section>

        <section>
          <TransferForm hospitals={inventory} onSuccess={load} />
        </section>
      </main>
    </div>
  );
}
