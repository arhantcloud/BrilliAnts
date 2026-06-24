import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const FLAVORS = [
  { name: "Strawberry", ring: "#fb7185", glaze: "#fbcfe8" },
  { name: "Blueberry", ring: "#60a5fa", glaze: "#bfdbfe" },
  { name: "Lemon", ring: "#fbbf24", glaze: "#fef08a" },
  { name: "Matcha", ring: "#34d399", glaze: "#bbf7d0" },
];

const MIN_N = 2;
const MAX_N = 4;
const MIN_K = 2;
const MAX_K = 6;

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

export default function DonutBox({ slide, onComplete }: CustomSlideProps) {
  const [n, setN] = useState(3); // flavors
  const [k, setK] = useState(3); // donuts in the box
  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState(false);

  const top = k + n - 1;
  const bottom = n - 1;
  const total = choose(top, bottom);
  const correct = answer.trim() !== "" && Number(answer) === total;

  function clear() {
    if (!solved) setAnswer("");
  }
  function changeN(v: number) {
    if (solved) return;
    setN(v);
    clear();
  }
  function changeK(v: number) {
    if (solved) return;
    setK(v);
    clear();
  }
  function onAnswer(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 4);
    setAnswer(d);
    if (d !== "" && Number(d) === total) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <div>
      <div className="inline-block rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-brand-700">
        Lesson 5 · Final challenge
      </div>
      <h2 className="mt-2 text-xl font-extrabold leading-tight">
        {slide.title ?? "The donut box"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        A bakery has <b>{n}</b> flavors. You grab a box of <b>{k}</b> donuts —
        repeats are fine and the order in the box doesn't matter. How many
        different boxes are possible?
      </p>

      {/* Steppers */}
      <div className="mt-4 flex items-center justify-center gap-8">
        <Stepper label="flavors (n)" value={n} min={MIN_N} max={MAX_N} onChange={changeN} disabled={solved} />
        <Stepper label="donuts (k)" value={k} min={MIN_K} max={MAX_K} onChange={changeK} disabled={solved} />
      </div>

      {/* Flavor palette */}
      <div className="mt-5 flex flex-wrap justify-center gap-4">
        {FLAVORS.slice(0, n).map((f) => (
          <div key={f.name} className="flex flex-col items-center gap-1">
            <div
              className="h-12 w-12 rounded-full border-[6px]"
              style={{ borderColor: f.ring, background: f.glaze }}
            >
              <div className="m-auto mt-2.5 h-2.5 w-2.5 rounded-full bg-white" />
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {f.name}
            </span>
          </div>
        ))}
      </div>

      {/* Readout */}
      <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
        <p className="flex flex-wrap items-center justify-center gap-2 text-xl font-extrabold tracking-wide">
          <span>
            C({k}+{n}−1, {n}−1) = C({top}, {bottom}) =
          </span>
          {solved ? (
            <span className="text-brand-300">{total}</span>
          ) : (
            <input
              type="text"
              inputMode="numeric"
              aria-label="number of possible boxes"
              value={answer}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="?"
              className={`w-24 rounded-lg px-2 py-1 text-center text-xl font-extrabold outline-none transition ${
                answer.trim() !== "" && !correct
                  ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
                  : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
              }`}
            />
          )}
        </p>
      </div>

      {solved && (
        <div className="mt-4 animate-fade-in-up rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold">Lesson 5 complete</p>
          <p className="mt-0.5">
            {total} possible boxes. Choosing with repeats = distributing into
            bins = stars and bars — the fourth and final counting world. Nice
            work finishing the map!
          </p>
        </div>
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
      >
        −
      </button>
      <div className="flex min-w-[72px] flex-col items-center">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="text-3xl font-extrabold text-brand-600">{value}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
