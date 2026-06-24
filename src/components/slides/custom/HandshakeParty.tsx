import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const MIN_N = 3;
const MAX_N = 8;
const COLORS = [
  "#fb7185",
  "#38bdf8",
  "#fbbf24",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#60a5fa",
  "#facc15",
];

function choose2(n: number) {
  return (n * (n - 1)) / 2;
}

export default function HandshakeParty({ slide, onComplete }: CustomSlideProps) {
  const [n, setN] = useState(5);
  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState(false);

  const handshakes = choose2(n);
  const correct = answer.trim() !== "" && Number(answer) === handshakes;

  function changeN(v: number) {
    if (solved) return;
    setN(v);
    setAnswer("");
  }

  function onAnswer(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 3);
    setAnswer(d);
    if (d !== "" && Number(d) === handshakes) {
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
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Every guest shakes hands with every other guest exactly once. A handshake
        is just a <b>pair</b> of people — order doesn't matter. How many
        handshakes happen?
      </p>

      {/* Guest count */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => changeN(Math.max(MIN_N, n - 1))}
          disabled={solved || n <= MIN_N}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
        >
          −
        </button>
        <div className="flex min-w-[64px] flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            guests (n)
          </span>
          <span className="text-3xl font-extrabold text-emerald-600">{n}</span>
        </div>
        <button
          onClick={() => changeN(Math.min(MAX_N, n + 1))}
          disabled={solved || n >= MAX_N}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
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
              stroke={solved ? "#34d399" : "#94a3b8"}
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

      {/* Readout */}
      <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-center text-white">
        <p className="flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold tracking-wide">
          <span>C({n}, 2) =</span>
          {solved ? (
            <span className="text-emerald-300">{handshakes}</span>
          ) : (
            <input
              type="text"
              inputMode="numeric"
              aria-label="number of handshakes"
              value={answer}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="?"
              className={`w-24 rounded-lg px-2 py-1 text-center text-2xl font-extrabold outline-none transition ${
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
          <p className="font-bold">Lesson 4 complete</p>
          <p className="mt-0.5">
            {handshakes} handshakes = {n}!/(2!·{n - 2}!). Every handshake is a{" "}
            <b>combination</b> — choose 2 of {n}, order ignored, no repeats.
          </p>
        </div>
      )}
    </div>
  );
}
