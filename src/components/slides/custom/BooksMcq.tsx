import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

const CORRECT_ID = "b";
const OPTIONS = [
  { id: "a", label: "25" },
  { id: "b", label: "120" },
  { id: "c", label: "60" },
  { id: "d", label: "5" },
];
const EXPLANATION =
  "5! = 5 × 4 × 3 × 2 × 1 = 120. Every position is filled with no reuse, so it's a full permutation.";
const HINT =
  "All 5 positions get filled and no book repeats. Multiply the shrinking choices: 5 × 4 × 3 × 2 × 1.";

const BOOKS = [
  { color: "bg-rose-400", h: 56 },
  { color: "bg-sky-400", h: 64 },
  { color: "bg-amber-400", h: 48 },
  { color: "bg-emerald-400", h: 60 },
  { color: "bg-violet-400", h: 52 },
];

// A few preset arrangements to cross-fade between (hints at "arrangements").
const ARRANGEMENTS = [
  [0, 1, 2, 3, 4],
  [2, 0, 4, 1, 3],
  [4, 3, 1, 2, 0],
  [1, 4, 0, 3, 2],
];

export default function BooksMcq({ slide, onComplete }: CustomSlideProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [solved, setSolved] = useState(false);
  const [arr, setArr] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setArr((a) => (a + 1) % ARRANGEMENTS.length),
      1800,
    );
    return () => clearInterval(t);
  }, []);

  const isCorrect = selected === CORRECT_ID;
  const order = ARRANGEMENTS[arr];

  function check() {
    if (!selected) return;
    setSubmitted(true);
    if (selected === CORRECT_ID) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Line up the books"}
      </h2>

      {/* Shelf */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex h-20 items-end justify-center gap-1.5">
          {order.map((bookIndex, pos) => {
            const b = BOOKS[bookIndex];
            return (
              <div
                key={pos}
                className={`w-7 animate-fade-in rounded-t ${b.color}`}
                style={{ height: `${b.h}px` }}
              />
            );
          })}
        </div>
        <div className="h-1.5 w-44 rounded-full bg-amber-800" />
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-slate-700">
        How many ways can you line up these 5 different books on the shelf?
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {OPTIONS.map((opt) => {
          const chosen = selected === opt.id;
          const showCorrect = submitted && opt.id === CORRECT_ID;
          const showWrong = submitted && chosen && !isCorrect;
          let cls = "border-slate-200 bg-white hover:border-brand-300";
          if (showCorrect) cls = "border-emerald-400 bg-emerald-50";
          else if (showWrong) cls = "border-red-400 bg-red-50";
          else if (chosen) cls = "border-brand-400 bg-brand-50";
          return (
            <button
              key={opt.id}
              disabled={solved}
              onClick={() => {
                if (solved) return;
                setSelected(opt.id);
                setSubmitted(false);
              }}
              className={`rounded-xl border-2 px-4 py-3.5 text-center text-base font-bold transition ${cls}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {submitted && (
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
          <p className="mt-0.5">{isCorrect ? EXPLANATION : HINT}</p>
        </div>
      )}

      {!solved && (
        <button
          onClick={check}
          disabled={!selected}
          className="btn-primary mt-5 w-full"
        >
          Check answer
        </button>
      )}
    </div>
  );
}
