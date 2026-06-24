import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const K = 3;
const TARGET = ["H", "T", "H"];

/** All length-K sequences over {H,T} — the sample space (2^K). */
function sequences(k: number): string[][] {
  if (k === 0) return [[]];
  return sequences(k - 1).flatMap((rest) => [
    ["H", ...rest],
    ["T", ...rest],
  ]);
}
const ALL = sequences(K);

export default function BuildFlips({ slide, onComplete }: CustomSlideProps) {
  const [built, setBuilt] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const full = built.length === K;
  const isCorrect = full && built.every((c, i) => c === TARGET[i]);

  function add(face: "H" | "T") {
    if (solved || full) return;
    const next = [...built, face];
    setBuilt(next);
    if (next.length === K && next.every((c, i) => c === TARGET[i])) {
      setSolved(true);
      onComplete();
    }
  }

  function reset() {
    if (solved) return;
    setBuilt([]);
  }

  const matches = (seq: string[]) => built.every((c, i) => seq[i] === c);
  const matchCount = ALL.filter(matches).length;

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Build a coin-flip sequence"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        A coin is flipped 3 times. Build the sequence{" "}
        <b>Heads, Tails, Heads</b>. Each flip is independent — there are 2 × 2 ×
        2 = 8 possible sequences.
      </p>

      {/* Built slots */}
      <div className="mt-4 flex justify-center gap-2.5">
        {Array.from({ length: K }, (_, i) => {
          const face = built[i];
          return (
            <div
              key={i}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-xl font-extrabold transition ${
                face
                  ? face === "H"
                    ? "border-transparent bg-amber-400 text-white"
                    : "border-transparent bg-slate-600 text-white"
                  : "border-dashed border-slate-200 bg-slate-50 text-slate-300"
              }`}
            >
              {face ?? "?"}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 flex justify-center gap-2.5">
        <button
          onClick={() => add("H")}
          disabled={solved || full}
          className="h-11 w-20 rounded-xl bg-amber-400 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40"
        >
          Heads
        </button>
        <button
          onClick={() => add("T")}
          disabled={solved || full}
          className="h-11 w-20 rounded-xl bg-slate-600 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40"
        >
          Tails
        </button>
      </div>

      {/* Live sample space */}
      <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-300">
            All 8 sequences
          </p>
          <p className="text-[13px] font-bold text-brand-300">
            {matchCount} of {ALL.length} possible
          </p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {ALL.map((seq, i) => {
            const on = matches(seq);
            return (
              <div
                key={i}
                className={`flex items-center justify-center gap-0.5 rounded-md py-1 text-[11px] font-bold transition ${
                  on ? "bg-white/10 text-white" : "text-slate-500 opacity-40"
                }`}
              >
                {seq.join("")}
              </div>
            );
          })}
        </div>
      </div>

      {full && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            isCorrect
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-bold">
            {isCorrect ? "Correct!" : "Not quite — try again"}
          </p>
          <p className="mt-0.5">
            {isCorrect
              ? "Each flip has 2 outcomes that can repeat, so there are 2³ = 8 sequences. Order matters and outcomes reuse."
              : "Build Heads, then Tails, then Heads."}
          </p>
        </div>
      )}

      {full && !solved && (
        <button onClick={reset} className="btn-primary mt-3 w-full">
          Try again
        </button>
      )}
    </div>
  );
}
