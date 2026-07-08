import {
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  useEffect,
  useRef,
  useState,
  Children,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import type { LucideProps } from "lucide-react";
import { CheckCircle, Info, XCircle, ChevronDown, Check } from "lucide-react";
import { BLOOD_GROUPS as BG_LIST, type BloodGroup as BG } from "../../lib/api";

// ── DataTable ─────────────────────────────────────────────────────
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  renderRow,
}: {
  columns: string[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  renderRow: (item: T, index: number) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
            {columns.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left" style={{ color: "var(--txt-mute)", fontWeight: 500 }}>
                <span className="mono text-[10px] uppercase tracking-[0.12em]">{h}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className="dt-row row-fade-in"
              style={{
                borderBottom: "1px solid var(--line)",
                animationDelay: `${Math.min(index * 40, 400)}ms`
              }}
            >
              {renderRow(item, index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


