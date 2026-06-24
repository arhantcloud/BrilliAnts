import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const CORRECT_ID = "c";
const OPTIONS = [
  { id: "a", label: "5040" },
  { id: "b", label: "40" },
  { id: "c", label: "10,000" },
  { id: "d", label: "24" },
];
const EXPLANATION =
  "Each of the 4 slots has 10 choices and digits can repeat: 10 × 10 × 10 × 10 = 10⁴ = 10,000.";
const HINT = "n choices per slot, k slots, reuse allowed → nᵏ. Here 10⁴.";

function DigitReel({ duration, start }: { duration: string; start: number }) {
  const single = Array.from({ length: 10 }, (_, i) => (start + i) % 10);
  return (
    <div className="h-8 w-6 overflow-hidden rounded bg-slate-800">
      <div
        className="flex animate-reel flex-col items-center"
        style={{ animationDuration: duration }}
      >
        {[...single, ...single].map((d, i) => (
          <span
            key={i}
            className="flex h-8 w-6 items-center justify-center text-sm font-bold text-white"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PinMcq({ slide, onComplete }: CustomSlideProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [solved, setSolved] = useState(false);

  const isCorrect = selected === CORRECT_ID;

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
        {slide.title ?? "Count the PINs"}
      </h2>

      <div className="mt-4 flex justify-center gap-1.5">
        <DigitReel duration="3s" start={4} />
        <DigitReel duration="3.8s" start={9} />
        <DigitReel duration="3.4s" start={1} />
        <DigitReel duration="4.2s" start={6} />
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-slate-700">
        How many different 4-digit PINs are possible? Digits are 0–9 and repeats
        are allowed.
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
