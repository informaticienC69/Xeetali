import { useEffect, useRef, useState } from "react";

// ── CountUp hook (requestAnimationFrame) ─────────────────────────
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function useCountUp(target: number, duration = 1200, delay = 0): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    // La règle CSS globale (prefers-reduced-motion) ne couvre que les
    // animations CSS — ce compteur tourne en JS (requestAnimationFrame) et
    // doit donc vérifier la préférence lui-même pour la respecter.
    if (prefersReducedMotion()) { setVal(target); return; }
    let start: number | null = null;
    const timeout = setTimeout(() => {
      function step(ts: number) {
        if (!start) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        setVal(Math.round(easeOut(progress) * target));
        if (progress < 1) raf.current = requestAnimationFrame(step);
        else setVal(target);
      }
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);
  return val;
}

export function CountUp({ value, duration, delay, className }: { value: number; duration?: number; delay?: number; className?: string }) {
  const v = useCountUp(value, duration, delay);
  return <span className={className}>{v.toLocaleString("fr-FR")}</span>;
}
