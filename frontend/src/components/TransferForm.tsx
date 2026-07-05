import { useState } from "react";
import {
  ApiError,
  BLOOD_GROUPS,
  createTransfer,
  type BloodGroup,
  type HospitalInventory,
} from "../api";

interface Props {
  hospitals: HospitalInventory[];
  onSuccess: () => void; // rafraîchit le tableau après un transfert réussi
}

type Feedback = { kind: "success" | "error"; message: string } | null;

// Formulaire d'initiation d'un transfert (UC-04) avec gestion d'erreur (409/422/404).
export default function TransferForm({ hospitals, onSuccess }: Props) {
  const [source, setSource] = useState<number | "">("");
  const [target, setTarget] = useState<number | "">("");
  const [groupe, setGroupe] = useState<BloodGroup>("O+");
  const [quantite, setQuantite] = useState<number>(1);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (source === "" || target === "") {
      setFeedback({ kind: "error", message: "Sélectionnez un hôpital source et cible." });
      return;
    }
    if (source === target) {
      setFeedback({ kind: "error", message: "La source et la cible doivent être différentes." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createTransfer({
        source_hospital_id: source,
        target_hospital_id: target,
        groupe_sanguin: groupe,
        quantite,
      });
      setFeedback({
        kind: "success",
        message: `Transfert #${res.id} ${res.statut} : ${res.quantite} poche(s) ${res.groupe_sanguin}.`,
      });
      onSuccess();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 409
            ? `Stock insuffisant : ${err.message}`
            : err.message
          : "Erreur réseau. Le backend est-il démarré ?";
      setFeedback({ kind: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  const selectCls =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Initier un transfert (UC-04)</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Hôpital source</span>
          <select
            className={selectCls}
            value={source}
            onChange={(e) => setSource(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">— choisir —</option>
            {hospitals.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>
                {h.nom}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Hôpital cible</span>
          <select
            className={selectCls}
            value={target}
            onChange={(e) => setTarget(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">— choisir —</option>
            {hospitals.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>
                {h.nom}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Groupe sanguin</span>
          <select className={selectCls} value={groupe} onChange={(e) => setGroupe(e.target.value as BloodGroup)}>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Quantité (poches)</span>
          <input
            type="number"
            min={1}
            className={selectCls}
            value={quantite}
            onChange={(e) => setQuantite(Math.max(1, Number(e.target.value)))}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {submitting ? "Transfert en cours…" : "Valider le transfert"}
      </button>

      {feedback && (
        <div
          className={
            "rounded-md px-4 py-3 text-sm " +
            (feedback.kind === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700")
          }
        >
          {feedback.message}
        </div>
      )}
    </form>
  );
}
