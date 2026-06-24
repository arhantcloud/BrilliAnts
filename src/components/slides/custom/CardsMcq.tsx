import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

const CORRECT_ID = "b";
const OPTIONS = [
  { id: "a", label: "60" },
  { id: "b", label: "10" },
  { id: "c", label: "125" },
  { id: "d", label: "15" },
];
const EXPLANATION =
  "Ordered, you'd have 5 × 4 × 3 = 60. But each hand is the same set dealt in any of 3! = 6 orders, so 60 ÷ 6 = C(5,3) = 10.";
const HINT =
  "A hand is a set — order doesn't matter. Take the ordered count 5 × 4 × 3 and divide by 3!.";

const CARDS = ["A", "2", "3", "4", "5"];
// A few 3-of-5 hands to highlight in turn.
const HANDS = [
  [0, 1, 2],
  [0, 2, 4],
  [1, 3, 4],
  [0, 1, 4],
  [2, 3, 4],
];

export default function CardsMcq({ slide, onComplete }: CustomSlideProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hand, setHand] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHand((h) => (h + 1) % HANDS.length), 1600);
    return () => clearInterval(t);
  }, []);

  const isCorrect = selected === CORRECT_ID;
  const active = HANDS[hand];

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
        {slide.title ?? "Count the hands"}
      </h2>

      {/* Cards */}
      <div className="mt-4 flex justify-center gap-1.5">
        {CARDS.map((rank, i) => {
          const on = active.includes(i);
          return (
            <div
              key={i}
              className={`flex h-16 w-11 items-center justify-center rounded-lg border-2 text-lg font-extrabold transition-all duration-300 ${
                on
                  ? "-translate-y-2 border-brand-400 bg-white text-brand-700 shadow-md"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {rank}
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-center text-[12px] font-semibold text-slate-400">
        one possible 3-card hand
      </p>

      <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
        How many different 3-card hands can you deal from these 5 cards? The
        order the cards arrive doesn't matter.
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
