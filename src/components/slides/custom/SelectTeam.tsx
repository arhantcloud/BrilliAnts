import { useState } from "react";
import type { CustomSlideProps } from "./registry";

type Person = { id: string; name: string; color: string };

const PEOPLE: Person[] = [
  { id: "ana", name: "Ana", color: "bg-rose-400" },
  { id: "bo", name: "Bo", color: "bg-sky-400" },
  { id: "cy", name: "Cy", color: "bg-amber-400" },
  { id: "di", name: "Di", color: "bg-violet-400" },
  { id: "eve", name: "Eve", color: "bg-emerald-400" },
];

const K = 3;
const CORRECT = ["ana", "cy", "eve"];

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

export default function SelectTeam({ slide, onComplete }: CustomSlideProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const full = selected.length === K;
  const isCorrect =
    full && CORRECT.every((id) => selected.includes(id));

  function toggle(id: string) {
    if (solved) return;
    setSelected((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= K) return sel;
      const next = [...sel, id];
      if (
        next.length === K &&
        CORRECT.every((c) => next.includes(c))
      ) {
        setSolved(true);
        onComplete();
      }
      return next;
    });
  }

  // Complete teams still consistent with the current (partial) selection.
  const consistent = choose(PEOPLE.length - selected.length, K - selected.length);
  const total = choose(PEOPLE.length, K);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Pick the team"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Only <b>Ana</b>, <b>Cy</b>, and <b>Eve</b> are free on Tuesday. Tap to
        pick the 3-person team that can meet — a team is a <i>set</i>, so the
        order you tap doesn't matter.
      </p>

      {/* People */}
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {PEOPLE.map((p) => {
          const on = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm transition active:scale-95 ${p.color} ${
                on ? "ring-4 ring-brand-300" : "opacity-80"
              }`}
            >
              {p.name}
              {on && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white ring-2 ring-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-300">
            Selected set
          </p>
          <p className="text-[13px] font-bold text-brand-300">
            {consistent} of {total} teams match
          </p>
        </div>
        <p className="mt-2 text-lg font-extrabold">
          {"{ "}
          {selected.length
            ? selected
                .map((id) => PEOPLE.find((p) => p.id === id)!.name)
                .join(", ")
            : "—"}
          {" }"}
        </p>
        <p className="mt-1 text-[12px] text-slate-400">
          There are C(5, 3) = 10 possible teams in all.
        </p>
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
              ? "A team is a set: {Ana, Cy, Eve} is the same no matter the order, and nobody repeats — a combination."
              : "Who is free on Tuesday? Pick exactly those three."}
          </p>
        </div>
      )}

      {full && !solved && (
        <button
          onClick={() => setSelected([])}
          className="btn-primary mt-3 w-full"
        >
          Clear
        </button>
      )}
    </div>
  );
}
