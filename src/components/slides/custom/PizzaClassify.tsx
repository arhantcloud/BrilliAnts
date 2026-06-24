import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const CORRECT_ID = "c";

const OPTIONS = [
  { id: "a", label: "Order matters, with replacement" },
  { id: "b", label: "Order matters, without replacement" },
  { id: "c", label: "Order doesn't matter, with replacement" },
  { id: "d", label: "Order doesn't matter, without replacement" },
];

const EXPLANATION =
  "Exactly. The same 8 toppings in any order make the same pizza (order doesn't matter), and you can use a topping more than once (with replacement). That's a multiset: choosing 8 from 4 types with repeats allowed.";
const HINT =
  "Does adding the toppings in a different order change the pizza? And can the same topping appear more than once?";

export default function PizzaClassify({ slide, onComplete }: CustomSlideProps) {
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
        {slide.title ?? "Build-your-own pizza"}
      </h2>

      <PizzaVisual />

      <p className="mt-4 text-[15px] leading-relaxed text-slate-700">
        You top a pizza with 8 toppings chosen from the 4 options shown, and you
        can use the same topping more than once. Which two properties describe
        this?
      </p>

      <div className="mt-5 space-y-2.5">
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
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-[15px] font-medium transition ${cls}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  chosen ? "border-brand-500 bg-brand-500" : "border-slate-300"
                }`}
              >
                {chosen && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span>{opt.label}</span>
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

const TOPPING_TYPES = [
  { name: "pepperoni", color: "bg-red-500" },
  { name: "mushroom", color: "bg-amber-800" },
  { name: "green pepper", color: "bg-green-600" },
  { name: "olive", color: "bg-neutral-800" },
];

/** Evenly spaced points on a ring, as left/top percentages. */
function ring(count: number, radius: number, startDeg: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = ((startDeg + i * (360 / count)) * Math.PI) / 180;
    return { left: 50 + radius * Math.cos(a), top: 50 + radius * Math.sin(a) };
  });
}

// 8 toppings (with repeats) spread over an outer ring of 5 + inner ring of 3.
const PLACED = [
  ...ring(5, 33, -90).map((p, i) => ({ ...p, type: [0, 2, 1, 3, 2][i] })),
  ...ring(3, 15, -30).map((p, i) => ({ ...p, type: [0, 1, 0][i] })),
];

/** Spinning pizza (8 toppings, repeats) beside the 4-topping menu. */
function PizzaVisual() {
  return (
    <div className="mt-4 flex items-center justify-center gap-5">
      <div className="relative h-28 w-28 shrink-0">
        <div className="animate-pizzaspin absolute inset-0">
          <div className="absolute inset-0 rounded-full border-[6px] border-amber-700 bg-amber-300" />
          <div className="absolute inset-[10px] rounded-full bg-yellow-200" />
          {PLACED.map((t, i) => (
            <span
              key={i}
              className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/10 ${TOPPING_TYPES[t.type].color}`}
              style={{ left: `${t.left}%`, top: `${t.top}%` }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          Toppings
        </p>
        <ul className="space-y-1.5">
          {TOPPING_TYPES.map((t) => (
            <li
              key={t.name}
              className="flex items-center gap-2 text-[12px] font-semibold text-slate-600"
            >
              <span className={`h-3 w-3 rounded-full ${t.color}`} />
              {t.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
