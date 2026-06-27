import { useState } from "react";
import type { CustomSlideProps } from "./registry";

/**
 * Lesson 5, slide 5 (capstone): a multiset count from scratch: choose k donuts
 * from n flavors, repeats allowed, order ignored. Count = C(k + n − 1, n − 1).
 */

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

export default function MultisetBox({ slide, onComplete }: CustomSlideProps) {
  const [n, setN] = useState(3); // flavors
  const [k, setK] = useState(3); // donuts in the box
  const [topInput, setTopInput] = useState("");
  const [bottomInput, setBottomInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [solved, setSolved] = useState(false);

  const top = k + n - 1;
  const bottom = n - 1;
  const total = choose(top, bottom);

  const topOk = topInput.trim() !== "" && Number(topInput) === top;
  const bottomOk = bottomInput.trim() !== "" && Number(bottomInput) === bottom;
  const subDone = topOk && bottomOk;
  const answerOk = answerInput.trim() !== "" && Number(answerInput) === total;

  const clean = (raw: string) => raw.replace(/\D/g, "").slice(0, 4);

  function clear() {
    setTopInput("");
    setBottomInput("");
    setAnswerInput("");
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
  function onTop(raw: string) {
    if (subDone || solved) return;
    setTopInput(clean(raw));
  }
  function onBottom(raw: string) {
    if (subDone || solved) return;
    setBottomInput(clean(raw));
  }
  function onAnswer(raw: string) {
    if (solved) return;
    const d = clean(raw);
    setAnswerInput(d);
    if (subDone && d !== "" && Number(d) === total) {
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
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        A bakery has <b>{n}</b> flavors. You grab a box of <b>{k}</b> donuts,
        repeats are fine and the order in the box doesn't matter. How many
        different boxes (multisets) are possible?
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
            <span className="text-[10px] font-bold text-stone-400">
              {f.name}
            </span>
          </div>
        ))}
      </div>

      {/* Readout: substitute n, k into the combination, then compute */}
      <div className="mt-5 rounded-2xl bg-stone-900 p-5 text-white">
        <p className="text-center text-[12px] font-semibold text-stone-300">
          Fill in the combination, then count the boxes
        </p>
        <div className="mt-3 space-y-2 text-xl font-extrabold tracking-wide">
          <p className="text-center text-stone-200">C(k + n − 1, n − 1)</p>
          <p className="flex flex-wrap items-center justify-center gap-2">
            <span>= C(</span>
            <NumInput
              aria="combination top"
              value={topInput}
              onChange={onTop}
              correct={topOk}
              disabled={subDone || solved}
            />
            <span>,</span>
            <NumInput
              aria="combination bottom"
              value={bottomInput}
              onChange={onBottom}
              correct={bottomOk}
              disabled={subDone || solved}
            />
            <span>)</span>
          </p>
          {subDone && (
            <p className="flex animate-fade-in flex-wrap items-center justify-center gap-2">
              <span>=</span>
              {solved ? (
                <span className="text-brand-300">{total}</span>
              ) : (
                <NumInput
                  aria="number of possible boxes"
                  value={answerInput}
                  onChange={onAnswer}
                  correct={answerOk}
                  disabled={solved}
                />
              )}
            </p>
          )}
        </div>
      </div>

      {solved && (
        <div className="mt-4 animate-fade-in-up rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold">Lesson 5 complete</p>
          <p className="mt-0.5">
            {total} possible boxes. Choosing with repeats while ignoring order is
            a <b>multiset</b>, counted by stars and bars, the fourth and final
            counting world. Nice work finishing the map!
          </p>
        </div>
      )}
    </div>
  );
}

function NumInput({
  aria,
  value,
  onChange,
  correct,
  disabled,
}: {
  aria: string;
  value: string;
  onChange: (v: string) => void;
  correct: boolean;
  disabled: boolean;
}) {
  const filled = value.trim() !== "";
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={aria}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="?"
      disabled={disabled}
      className={`w-20 rounded-lg px-2 py-1 text-center text-xl font-extrabold outline-none transition ${
        correct
          ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
          : filled
            ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
            : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
      }`}
    />
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
        className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-2xl font-bold text-stone-600 transition active:scale-90 disabled:opacity-40"
      >
        −
      </button>
      <div className="flex min-w-[72px] flex-col items-center">
        <span className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
          {label}
        </span>
        <span className="text-3xl font-extrabold text-brand-600">{value}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-2xl font-bold text-stone-600 transition active:scale-90 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
