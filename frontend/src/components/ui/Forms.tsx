import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

// ── Field ─────────────────────────────────────────────────────────
// Associe le <label> à son contrôle (id/htmlFor) quand l'enfant est un seul
// élément (Input/Select) — un <label> et son champ simplement voisins dans
// le DOM ne sont PAS liés pour un lecteur d'écran, contrairement à un <label
// for="…">. Repli silencieux (comportement identique à avant) si l'enfant
// n'est pas un élément unique clonable (ex. un groupe de boutons — ceux-là
// relèvent plutôt d'un <fieldset>/<legend>).
export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  const generatedId = useId();
  const only = Children.count(children) === 1 && isValidElement(children) ? (children as ReactElement<any>) : null;
  const controlId: string | undefined = only ? (only.props.id ?? generatedId) : undefined;
  const content = only && only.props.id == null ? cloneElement(only, { id: controlId }) : children;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={controlId} className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--txt-mute)" }}>
        {label}
      </label>
      {content}
    </div>
  );
}


// ── Input ─────────────────────────────────────────────────────────
export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`cc-input ${className}`}
    />
  );
}


// ── SearchInput ───────────────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}


// ── Select ────────────────────────────────────────────────────────
// Select natif (pas de listbox maison) : clavier, VoiceOver/TalkBack et le
// picker mobile du système fonctionnent sans code supplémentaire. Stylé via
// .cc-select (index.css) pour rester visuellement aligné avec .cc-input.
export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`cc-select ${className}`} {...props}>
      {children}
    </select>
  );
}


