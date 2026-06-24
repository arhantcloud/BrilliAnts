import { useState } from "react";
import type { CustomSlideProps } from "./registry";

type Runner = { id: string; name: string; color: string };

const RUNNERS: Runner[] = [
  { id: "amy", name: "Amy", color: "bg-rose-400" },
  { id: "ben", name: "Ben", color: "bg-sky-400" },
  { id: "cara", name: "Cara", color: "bg-emerald-400" },
];

const CORRECT = ["cara", "amy", "ben"];
const PLACES = ["1st", "2nd", "3rd"];

/** All orderings of the three runners (the sample space). */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((item, i) =>
    permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

const ALL_ORDERS = permutations(RUNNERS.map((r) => r.id));

function runner(id: string) {
  return RUNNERS.find((r) => r.id === id)!;
}

export default function BuildPodium({ slide, onComplete }: CustomSlideProps) {
  const [built, setBuilt] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const remaining = RUNNERS.filter((r) => !built.includes(r.id));
  const full = built.length === RUNNERS.length;
  const isCorrect = full && built.every((id, i) => id === CORRECT[i]);

  function place(id: string) {
    if (solved || built.includes(id)) return;
    const next = [...built, id];
    setBuilt(next);
    if (next.length === RUNNERS.length && next.every((x, i) => x === CORRECT[i])) {
      setSolved(true);
      onComplete();
    }
  }

  function reset() {
    if (solved) return;
    setBuilt([]);
  }

  // An ordering is still "possible" if it matches everything placed so far.
  const matches = (order: string[]) =>
    built.every((id, i) => order[i] === id);
  const matchCount = ALL_ORDERS.filter(matches).length;

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Build the podium"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        <b>Cara</b> finished ahead of <b>Amy</b>, and <b>Amy</b> finished ahead
        of <b>Ben</b>. Tap to place them on the podium (1st on top).
      </p>

      {/* Podium */}
      <div className="mt-4 space-y-2">
        {PLACES.map((place_, i) => {
          const id = built[i];
          const r = id ? runner(id) : null;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-8 text-right text-sm font-extrabold text-slate-400">
                {place_}
              </span>
              <div
                className={`flex h-12 flex-1 items-center rounded-xl border-2 px-3 transition ${
                  r
                    ? "border-transparent text-white " + r.color
                    : "border-dashed border-slate-200 bg-slate-50"
                }`}
              >
                {r && <span className="font-bold">{r.name}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pool */}
      <div className="mt-4 flex min-h-[48px] flex-wrap justify-center gap-2.5">
        {remaining.map((r) => (
          <button
            key={r.id}
            onClick={() => place(r.id)}
            className={`flex h-11 items-center rounded-xl px-4 text-sm font-bold text-white shadow-sm transition active:scale-95 ${r.color}`}
          >
            {r.name}
          </button>
        ))}
        {remaining.length === 0 && !solved && (
          <span className="self-center text-sm font-semibold text-slate-400">
            Podium full
          </span>
        )}
      </div>

      {/* Live sample space */}
      <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-300">
            All possible orders
          </p>
          <p className="text-[13px] font-bold text-brand-300">
            {matchCount} of {ALL_ORDERS.length} possible
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ALL_ORDERS.map((order, i) => {
            const on = matches(order);
            return (
              <div
                key={i}
                className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 transition ${
                  on ? "bg-white/10" : "opacity-25"
                }`}
              >
                {order.map((id) => (
                  <span
                    key={id}
                    className={`h-4 w-4 rounded-full ${runner(id).color}`}
                  />
                ))}
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
              ? "3 × 2 × 1 = 6 possible orders, and the clues pin down exactly one. Order matters and nobody repeats — a permutation."
              : "Use the clues: Cara is ahead of Amy, who is ahead of Ben."}
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
