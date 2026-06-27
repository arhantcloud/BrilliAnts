import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

const MIN = 1;
const MAX = 8;

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

export default function Factorials({ slide, onComplete }: CustomSlideProps) {
  const [n, setN] = useState(5);

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const value = factorial(n);
  const terms = Array.from({ length: n }, (_, i) => n - i);
  const maxLog = Math.log(factorial(MAX));

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Factorials"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Arranging all <b>n</b> items in order multiplies the shrinking choices:
        n × (n−1) × … × 1. We write this <b>n!</b> ("n factorial"). Drag n and
        watch it explode.
      </p>

      {/* Stepper */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          onClick={() => setN((v) => Math.max(MIN, v - 1))}
          disabled={n === MIN}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-2xl font-bold text-stone-600 transition active:scale-90 disabled:opacity-40"
        >
          −
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
            n
          </span>
          <span className="text-3xl font-extrabold text-brand-600">{n}</span>
        </div>
        <button
          onClick={() => setN((v) => Math.min(MAX, v + 1))}
          disabled={n === MAX}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-2xl font-bold text-stone-600 transition active:scale-90 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* Expansion */}
      <div className="mt-5 rounded-2xl bg-stone-900 p-5 text-center text-white">
        <p key={n} className="animate-fade-in text-xl font-extrabold tracking-wide">
          {n}! = {terms.join(" × ")}
        </p>
        <p key={`v-${n}`} className="mt-2 animate-fade-in text-3xl font-extrabold text-brand-300">
          {value.toLocaleString()}
        </p>
      </div>

      {/* Growth bars (log-scaled heights) */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-400">
          How fast it grows
        </p>
        <div className="flex h-28 items-end justify-between gap-1.5">
          {Array.from({ length: MAX }, (_, i) => {
            const k = i + 1;
            const fk = factorial(k);
            const h = 8 + (Math.log(fk) / maxLog) * 92; // percent
            const on = k <= n;
            return (
              <div key={k} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    on ? "bg-brand-500" : "bg-stone-200"
                  }`}
                  style={{ height: `${h}%` }}
                />
                <span
                  className={`text-[9px] font-bold ${
                    on ? "text-brand-600" : "text-stone-300"
                  }`}
                >
                  {k}!
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
