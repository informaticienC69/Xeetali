import { type ComponentType, type ReactNode } from "react";
import { Inbox, type LucideProps } from "lucide-react";

// ── EmptyState ────────────────────────────────────────────────────
// icon/action sont optionnels — les appels existants (message seul)
// continuent de fonctionner à l'identique.
export function EmptyState({
  message,
  icon: Icon = Inbox,
  action,
}: {
  message: string;
  icon?: ComponentType<LucideProps>;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
      >
        <Icon size={20} style={{ color: "var(--txt-mute)" }} aria-hidden="true" />
      </div>
      <p className="mono text-[12px] max-w-xs" style={{ color: "var(--txt-mute)" }}>{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
