import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

type Person = { id: string; label: string; color: string };

const PEOPLE: Person[] = [
  { id: "A", label: "A", color: "bg-rose-400" },
  { id: "B", label: "B", color: "bg-sky-400" },
  { id: "C", label: "C", color: "bg-amber-400" },
  { id: "D", label: "D", color: "bg-violet-400" },
];

function person(id: string) {
  return PEOPLE.find((p) => p.id === id)!;
}

// Ordered pairs (12) and unordered combinations (6).
const ORDERED: [string, string][] = [];
for (const a of PEOPLE)
  for (const b of PEOPLE) if (a.id !== b.id) ORDERED.push([a.id, b.id]);
const COMBOS: [string, string][] = [];
for (let i = 0; i < PEOPLE.length; i++)
  for (let j = i + 1; j < PEOPLE.length; j++)
    COMBOS.push([PEOPLE[i].id, PEOPLE[j].id]);

export default function CollapseOrders({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [orderMatters, setOrderMatters] = useState(true);

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const items = orderMatters ? ORDERED : COMBOS;

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "When order stops mattering"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Pick 2 of 4 people. If order matters there are 4 × 3 = 12 ordered picks.
        But a <b>team</b> {`{A, B}`} is the same as {`{B, A}`} — flip the switch
        to collapse the duplicates.
      </p>

      {/* Toggle */}
      <div className="mt-4 flex justify-center">
        <div className="flex rounded-full bg-slate-100 p-1">
          <button
            onClick={() => setOrderMatters(true)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              orderMatters ? "bg-brand-500 text-white" : "text-slate-500"
            }`}
          >
            Order matters
          </button>
          <button
            onClick={() => setOrderMatters(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              !orderMatters ? "bg-brand-500 text-white" : "text-slate-500"
            }`}
          >
            Order ignored
          </button>
        </div>
      </div>

      {/* Grid of picks */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {items.map(([a, b], i) => (
          <div
            key={i}
            className="flex animate-pop-in items-center justify-center gap-1 rounded-xl border-2 border-slate-100 bg-white py-2"
          >
            <Dot id={a} />
            {orderMatters && <span className="text-slate-300">→</span>}
            <Dot id={b} />
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-center text-white">
        <p className="text-2xl font-extrabold">
          {orderMatters ? (
            <>
              4 × 3 = <span className="text-brand-300">12 ordered</span>
            </>
          ) : (
            <>
              12 ÷ 2! = <span className="text-emerald-300">6 teams</span>
            </>
          )}
        </p>
        <p className="mt-2 text-[13px] text-slate-300">
          {orderMatters
            ? "Each team shows up twice (A→B and B→A)."
            : "Divide out the 2! orderings of each pair to count groups."}
        </p>
      </div>
    </div>
  );
}

function Dot({ id }: { id: string }) {
  const p = person(id);
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${p.color}`}
    >
      {p.label}
    </span>
  );
}
