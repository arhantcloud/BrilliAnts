import { useState } from "react";
import type { CustomSlideProps } from "./registry";

/**
 * Lesson 5, slide 1: introduce a multiset: choose K scoops from N flavors,
 * repeats allowed, order ignored. Building a full cup completes the slide; a
 * "shuffle" shows that reordering the scoops is the very same cup.
 */

const K = 3; // scoops per cup
const FLAVORS = [
  { id: "van", name: "Vanilla", color: "bg-amber-200", dot: "bg-amber-300" },
  { id: "choc", name: "Choc", color: "bg-amber-800", dot: "bg-amber-800" },
  { id: "straw", name: "Strawberry", color: "bg-rose-300", dot: "bg-rose-400" },
  { id: "mint", name: "Mint", color: "bg-emerald-300", dot: "bg-emerald-400" },
];

export default function MultisetBuild({ slide, onComplete }: CustomSlideProps) {
  const [scoops, setScoops] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const full = scoops.length === K;
  const counts = FLAVORS.map((f) => scoops.filter((s) => s === f.id).length);

  function add(id: string) {
    if (solved || scoops.length >= K) return;
    const next = [...scoops, id];
    setScoops(next);
    if (next.length === K) {
      setSolved(true);
      onComplete();
    }
  }
  function reset() {
    if (solved) return;
    setScoops([]);
  }
  function shuffle() {
    setScoops((prev) => {
      const a = [...prev];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    });
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Scoops in a cup"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Build a cup of <b>{K} scoops</b> from {FLAVORS.length} flavors. You can
        repeat a flavor, and the <b>order doesn't matter</b>, a cup is just{" "}
        <i>how many of each flavor</i> you picked. That's a <b>multiset</b>.
      </p>

      {/* Flavor picker */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {FLAVORS.map((f) => (
          <button
            key={f.id}
            onClick={() => add(f.id)}
            disabled={solved || full}
            aria-label={`add ${f.name}`}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-3 text-sm font-bold text-stone-700 shadow-sm transition active:scale-95 disabled:opacity-40"
          >
            <span className={`h-3.5 w-3.5 rounded-full ${f.dot}`} />+ {f.name}
          </button>
        ))}
      </div>

      {/* The cup + the multiset readout */}
      <div className="mt-5 flex items-center justify-center gap-6">
        <div className="flex w-28 flex-col items-center">
          <span className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-400">
            Your cup
          </span>
          <div className="flex h-24 flex-col-reverse items-center justify-start">
            {scoops.length === 0 && (
              <span className="text-xs text-stone-300">tap a flavor</span>
            )}
            {scoops.map((id, i) => {
              const f = FLAVORS.find((x) => x.id === id)!;
              return (
                <div
                  key={i}
                  className={`-mb-1 h-6 w-12 animate-pop-in rounded-full ring-1 ring-white ${f.color}`}
                />
              );
            })}
          </div>
          <div className="h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-amber-700" />
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <span className="mb-1 text-[11px] font-bold uppercase tracking-wide text-stone-400">
            How many of each
          </span>
          {FLAVORS.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2 text-sm">
              <span className={`h-3 w-3 rounded-full ${f.dot}`} />
              <span className="w-20 font-semibold text-stone-600">{f.name}</span>
              <span className="text-lg font-extrabold text-stone-800">
                {counts[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {full ? (
        <div className="mt-5 animate-fade-in-up rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold">That's one multiset.</p>
          <p className="mt-0.5">
            The cup is defined only by the counts above, shuffle the scoops and
            it's still the same cup.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={shuffle}
              className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95"
            >
              Shuffle order
            </button>
            <button
              onClick={reset}
              className="rounded-full bg-stone-200 px-4 py-1.5 text-xs font-bold text-stone-600 transition active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        scoops.length > 0 && (
          <button onClick={reset} className="btn-ghost mt-4 w-full">
            Reset
          </button>
        )
      )}
    </div>
  );
}
