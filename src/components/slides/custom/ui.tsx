import type { ReactNode } from "react";

/** A labeled −/+ stepper used by the "explorer" slides. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
      >
        −
      </button>
      <div className="flex min-w-[68px] flex-col items-center">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="text-3xl font-extrabold text-brand-600">{value}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

/** Dark "results" panel used across slides. */
export function Readout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
      {children}
    </div>
  );
}
