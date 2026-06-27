import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const MIN_N = 3;
const MAX_N = 8;
const COLORS = [
  "#c05f33",
  "#d27c4f",
  "#fbbf24",
  "#9e8b5f",
  "#34d399",
  "#e3a079",
  "#84724a",
  "#facc15",
];

function choose2(n: number) {
  return (n * (n - 1)) / 2;
}

type Key = "cN" | "cK" | "pN" | "pK" | "kf" | "f1" | "f2" | "d1" | "res";
const EMPTY: Record<Key, string> = {
  cN: "",
  cK: "",
  pN: "",
  pK: "",
  kf: "",
  f1: "",
  f2: "",
  d1: "",
  res: "",
};

export default function HandshakeParty({ slide, onComplete }: CustomSlideProps) {
  const [n, setN] = useState(5);
  const [vals, setVals] = useState<Record<Key, string>>({ ...EMPTY });
  const [solved, setSolved] = useState(false);

  const handshakes = choose2(n);
  const expected: Record<Key, number> = {
    cN: n,
    cK: 2,
    pN: n,
    pK: 2,
    kf: 2,
    f1: n,
    f2: n - 1,
    d1: 2,
    res: handshakes,
  };

  const isCorrect = (k: Key, v = vals) =>
    v[k].trim() !== "" && Number(v[k]) === expected[k];
  const allCorrect = (v: Record<Key, string>) =>
    (Object.keys(expected) as Key[]).every((k) => isCorrect(k, v));

  function changeN(next: number) {
    if (solved) return;
    setN(next);
    setVals({ ...EMPTY });
  }

  function setVal(k: Key, raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 3);
    const next = { ...vals, [k]: d };
    setVals(next);
    if (allCorrect(next)) {
      setSolved(true);
      onComplete();
    }
  }

  // Points on a circle for the n guests.
  const size = 230;
  const c = size / 2;
  const r = size / 2 - 26;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  });
  const pairs: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);

  return (
    <div>
      <div className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-700">
        Lesson 4 · Final challenge
      </div>
      <h2 className="mt-2 text-xl font-extrabold leading-tight">
        {slide.title ?? "The handshake party"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Every guest shakes hands with every other guest exactly once. A handshake
        is just a <b>pair</b> of people, and order doesn't matter. How many
        handshakes happen?
      </p>

      {/* Guest count */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => changeN(Math.max(MIN_N, n - 1))}
          disabled={solved || n <= MIN_N}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-2xl font-bold text-stone-600 transition active:scale-90 disabled:opacity-40"
        >
          −
        </button>
        <div className="flex min-w-[64px] flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
            guests (n)
          </span>
          <span className="text-3xl font-extrabold text-emerald-600">{n}</span>
        </div>
        <button
          onClick={() => changeN(Math.min(MAX_N, n + 1))}
          disabled={solved || n >= MAX_N}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-2xl font-bold text-stone-600 transition active:scale-90 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* Handshake graph */}
      <div className="mt-4 flex justify-center">
        <svg width={size} height={size} className="max-w-full">
          {pairs.map(([i, j], idx) => (
            <line
              key={idx}
              x1={pts[i].x}
              y1={pts[i].y}
              x2={pts[j].x}
              y2={pts[j].y}
              stroke={solved ? "#34d399" : "#a8a29e"}
              strokeWidth={1.5}
              strokeOpacity={0.55}
              className="animate-fade-in"
            />
          ))}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={12}
              fill={COLORS[i % COLORS.length]}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>

      {/* Expansion readout: every number is a fill-in blank */}
      <div className="mt-4 rounded-2xl bg-stone-900 p-5 text-center text-white">
        <div className="inline-block space-y-2 text-left text-2xl font-extrabold tracking-wide">
          <p className="flex flex-wrap items-center gap-1.5">
            <span>C(</span>
            <DarkField k="cN" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} narrow />
            <span>,</span>
            <DarkField k="cK" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} narrow />
            <span>) =</span>
            <span>P(</span>
            <DarkField k="pN" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} narrow />
            <span>,</span>
            <DarkField k="pK" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} narrow />
            <span>) /</span>
            <DarkField k="kf" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} narrow />
            <span>!</span>
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span>=</span>
            <span className="text-stone-400">(</span>
            <DarkField k="f1" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} />
            <span>×</span>
            <DarkField k="f2" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} />
            <span className="text-stone-400">) /</span>
            <DarkField k="d1" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} />
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span>=</span>
            <DarkField k="res" vals={vals} isCorrect={isCorrect} solved={solved} onChange={setVal} wide />
          </p>
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Fill in every number
        </p>
      </div>

      {solved && (
        <div className="mt-4 animate-fade-in-up rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold">Lesson 4 complete</p>
          <p className="mt-0.5">
            C({n}, 2) = P({n}, 2) / 2! = ({n} × {n - 1}) / 2 = {handshakes}. Every
            handshake is a <b>combination</b>: choose 2 of {n}, order ignored.
          </p>
        </div>
      )}
    </div>
  );
}

function DarkField({
  k,
  vals,
  isCorrect,
  solved,
  onChange,
  wide,
  narrow,
}: {
  k: Key;
  vals: Record<Key, string>;
  isCorrect: (k: Key, v?: Record<Key, string>) => boolean;
  solved: boolean;
  onChange: (k: Key, v: string) => void;
  wide?: boolean;
  narrow?: boolean;
}) {
  const value = vals[k];
  const correct = isCorrect(k);
  const filled = value.trim() !== "";
  const width = narrow ? "w-12" : wide ? "w-16" : "w-14";
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={`value ${k}`}
      value={value}
      onChange={(e) => onChange(k, e.target.value)}
      placeholder="?"
      disabled={solved}
      className={`${width} rounded-lg px-1 py-1 text-center text-2xl font-extrabold outline-none transition ${
        correct
          ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
          : filled
            ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
            : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
      }`}
    />
  );
}
