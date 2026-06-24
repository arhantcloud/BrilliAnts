import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

const CORRECT_ID = "b";
const OPTIONS = [
  { id: "a", label: "2" },
  { id: "b", label: "3" },
  { id: "c", label: "4" },
  { id: "d", label: "6" },
];
const EXPLANATION =
  "2 stars + 1 bar, and you choose where the bar goes: C(2 + 2 − 1, 2 − 1) = C(3, 1) = 3. The distributions are (2,0), (1,1), (0,2).";
const HINT =
  "Candies are identical and a jar may be empty. Use stars and bars: C(k + n − 1, n − 1).";

const DISTS = [
  [2, 0],
  [1, 1],
  [0, 2],
];

export default function MultisetMcq({ slide, onComplete }: CustomSlideProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [solved, setSolved] = useState(false);
  const [d, setD] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setD((x) => (x + 1) % DISTS.length), 1400);
    return () => clearInterval(t);
  }, []);

  const isCorrect = selected === CORRECT_ID;
  const dist = DISTS[d];

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
        {slide.title ?? "Count the distributions"}
      </h2>

      <div className="mt-4 flex justify-center gap-4">
        {dist.map((c, jar) => (
          <div key={jar} className="flex flex-col items-center gap-1">
            <div className="flex h-20 w-20 flex-col-reverse items-center gap-1 rounded-b-2xl rounded-t-md border-2 border-slate-300 bg-slate-50 p-2">
              {Array.from({ length: c }, (_, i) => (
                <span
                  key={i}
                  className="h-5 w-5 animate-pop-in rounded-full bg-pink-400"
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Jar {jar + 1}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-[12px] font-semibold text-slate-400">
        one possible distribution
      </p>

      <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
        How many ways can you put <b>2 identical candies</b> into{" "}
        <b>2 jars</b>? A jar is allowed to be empty.
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
