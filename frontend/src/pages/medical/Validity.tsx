// Validity.tsx — Vérification poche avec historique local et feedback premium
import { useState, useEffect } from "react";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { api, ApiError, type PouchValidity } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button, Card, Input, StatusBadge, PageHeader } from "../../components/ui";

const HISTORY_KEY = "xeetali_validity_history";
const MAX_HISTORY = 8;

interface HistoryEntry {
  uid: string;
  valide: boolean;
  checkedAt: string;
}

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

export default function Validity() {
  const toast = useToast();
  const [uid, setUid] = useState("");
  const [result, setResult] = useState<PouchValidity | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // Persist history
  useEffect(() => { saveHistory(history); }, [history]);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim()) return;
    await runCheck(uid.trim());
  }

  async function runCheck(uidToCheck: string) {
    setUid(uidToCheck);
    setLoading(true);
    try {
      const res = await api.pouchValidity(uidToCheck);
      setResult(res);
      // Ajouter à l'historique (dédupliqué)
      setHistory((prev) => [
        { uid: uidToCheck, valide: res.valide, checkedAt: new Date().toISOString() },
        ...prev.filter((h) => h.uid !== uidToCheck),
      ]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérifier la validité d'une poche"
        subtitle="Contrôle qualité"
        icon={ShieldCheck}
      />

      {/* ── Formulaire de vérification ── */}
      <Card title="Recherche par UID" subtitle="Contrôle d'existence et de péremption.">
        <form onSubmit={check} className="flex flex-wrap items-end gap-3">
          <div className="grow min-w-48">
            <label className="mono text-[10px] uppercase tracking-[0.14em] mb-1.5 block" style={{ color: "var(--txt-mute)" }}>
              UID de la poche
            </label>
            <Input
              value={uid}
              onChange={(e) => setUid(e.target.value.toUpperCase())}
              placeholder="XEE-XXXXXXXXXXXX"
              className="font-mono uppercase"
              autoFocus
            />
          </div>
          <Button type="submit" loading={loading}>Vérifier</Button>
          {uid && (
            <Button
              variant="ghost"
              onClick={() => { setUid(""); setResult(null); }}
              type="button"
            >
              Effacer
            </Button>
          )}
        </form>

      </Card>

      {/* ── Résultat ── */}
      {result && (
        <Card title="Résultat">
          <div
            className="card-in rounded-xl overflow-hidden"
            style={{
              border: `1px solid ${result.valide ? "rgba(22,163,74,0.35)" : "rgba(230,57,70,0.35)"}`,
            }}
          >
            {/* Bandeau de statut */}
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{
                background: result.valide
                  ? "rgba(22,163,74,0.10)"
                  : "rgba(230,57,70,0.10)",
                borderBottom: `1px solid ${result.valide ? "rgba(22,163,74,0.20)" : "rgba(230,57,70,0.20)"}`,
              }}
            >
              {result.valide ? (
                <CheckCircle2 size={24} style={{ color: "var(--ok)" }} />
              ) : (
                <XCircle size={24} className="pulse-soft" style={{ color: "var(--blood)" }} />
              )}
              <div>
                <div
                  className="syne font-bold text-lg"
                  style={{ color: result.valide ? "var(--ok)" : "var(--blood)" }}
                >
                  {result.valide ? "Poche valide et disponible" : "Poche non utilisable"}
                </div>
                <div className="mono text-[11px] mt-0.5" style={{ color: "var(--txt-mute)" }}>
                  {result.motif}
                </div>
              </div>
            </div>

            {/* Détails */}
            <div className="px-5 py-4">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="mono text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--txt-mute)" }}>UID</dt>
                  <dd className="font-mono font-semibold text-[12px]" style={{ color: "var(--txt)" }}>{result.uid}</dd>
                </div>
                <div>
                  <dt className="mono text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--txt-mute)" }}>En base</dt>
                  <dd className="syne font-bold text-sm" style={{ color: result.existe ? "var(--ok)" : "var(--blood)" }}>
                    {result.existe ? "Oui" : "Non"}
                  </dd>
                </div>
                {result.statut && (
                  <div>
                    <dt className="mono text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--txt-mute)" }}>Statut</dt>
                    <dd><StatusBadge statut={result.statut} /></dd>
                  </div>
                )}
                {result.date_peremption && (
                  <div>
                    <dt className="mono text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--txt-mute)" }}>Péremption</dt>
                    <dd className="mono text-[12px]" style={{ color: "var(--txt)" }}>{result.date_peremption}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </Card>
      )}

      {/* Historique des vérifications récentes */}
      {history.length > 0 && (
        <Card title="Vérifications récentes">
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <button
                key={h.uid}
                type="button"
                onClick={() => runCheck(h.uid)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all cursor-pointer"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                }}
                onMouseEnter={(e) => { 
                  (e.currentTarget as HTMLElement).style.borderColor = h.valide ? "rgba(22,163,74,0.4)" : "rgba(230,57,70,0.4)";
                  (e.currentTarget as HTMLElement).style.background = h.valide ? "rgba(22,163,74,0.05)" : "rgba(230,57,70,0.05)";
                }}
                onMouseLeave={(e) => { 
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: h.valide ? "rgba(22,163,74,0.12)" : "rgba(230,57,70,0.12)" }}>
                    {h.valide
                      ? <CheckCircle2 size={16} style={{ color: "var(--ok)" }} />
                      : <XCircle size={16} style={{ color: "var(--blood)" }} />
                    }
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="mono text-[12px] font-bold tracking-wider" style={{ color: "var(--txt)" }}>
                      {h.uid}
                    </span>
                    <span className="syne font-semibold text-[11px] mt-0.5" style={{ color: h.valide ? "var(--ok)" : "var(--blood)" }}>
                      {h.valide ? "Valide & Utilisable" : "Poche Invalide"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mono text-[10px]" style={{ color: "var(--txt-mute)" }}>
                  <Clock size={12} />
                  {new Date(h.checkedAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
