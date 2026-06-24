import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

const N = 6;

export default function PermuteK({ slide, onComplete }: CustomSlideProps) {
  const [k, setK] = useState(3);

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  // Choices for each of the k filled positions: N, N-1, ... (k terms).
  const terms = Array.from({ length: k }, (_, i) => N - i);
  const product = terms.reduce((a, b) => a * b, 1);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "What if you don't fill every seat?"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        With <b>{N}</b> people but only <b>k</b> seats, you stop multiplying
        early — just the first k shrinking choices. Change k and watch.
      </p>

      {/* Stepper */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          onClick={() => setK((v) => Math.max(1, v - 1))}
          disabled={k === 1}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
        >
          −
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            seats (k)
          </span>
          <span className="text-3xl font-extrabold text-brand-600">{k}</span>
        </div>
        <button
          onClick={() => setK((v) => Math.min(N, v + 1))}
          disabled={k === N}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* Seats: first k filled with their choice counts, rest empty */}
      <div className="mt-5 flex justify-center gap-1.5">
        {Array.from({ length: N }, (_, i) => {
          const filled = i < k;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className={`text-[11px] font-bold ${
                  filled ? "text-brand-600" : "text-transparent"
                }`}
              >
                {N - i}
              </span>
              <div
                className={`h-11 w-9 rounded-lg border-2 transition ${
                  filled
                    ? "border-brand-400 bg-brand-50"
                    : "border-dashed border-slate-200 bg-slate-50"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Readout */}
      <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
        <p key={k} className="animate-fade-in text-xl font-extrabold tracking-wide">
          {terms.join(" × ")}{" "}
          <span className="text-brand-300">= {product.toLocaleString()}</span>
        </p>
        <p className="mt-2 text-[13px] text-slate-300">
          That's {N}! / ({N}−{k})! = {N}! / {N - k}! — pick {k} of {N} in order.
        </p>
      </div>
    </div>
  );
}
