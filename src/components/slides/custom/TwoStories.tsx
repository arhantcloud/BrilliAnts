import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const TOTAL = 3;
const FLAVORS = [
  { id: "van", name: "Vanilla", dot: "bg-amber-200", scoop: "bg-amber-200" },
  { id: "choc", name: "Choc", dot: "bg-amber-800", scoop: "bg-amber-800" },
];

export default function TwoStories({ slide, onComplete }: CustomSlideProps) {
  const [scoops, setScoops] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const counts = FLAVORS.map((f) => scoops.filter((s) => s === f.id).length);
  const done = scoops.length === TOTAL;

  function add(id: string) {
    if (scoops.length >= TOTAL) return;
    const next = [...scoops, id];
    setScoops(next);
    if (next.length === TOTAL && !solved) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Two stories, one count"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Build a cup of <b>3 scoops</b> from 2 flavors (repeats allowed). Watch
        the bins on the right: <b>choosing</b> scoops is the very same thing as{" "}
        <b>distributing</b> them into flavor-bins.
      </p>

      <div className="mt-4 flex justify-center gap-2.5">
        {FLAVORS.map((f) => (
          <button
            key={f.id}
            onClick={() => add(f.id)}
            disabled={done}
            className="flex h-11 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-40"
          >
            <span className={`h-3.5 w-3.5 rounded-full ${f.dot}`} />+ {f.name}
          </button>
        ))}
      </div>

      {/* Choice = Distribution, side by side */}
      <div className="mt-5 flex items-center justify-center gap-4">
        {/* Choice: the cup */}
        <div className="flex w-28 flex-col items-center">
          <span className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Your scoops
          </span>
          <div className="flex h-24 flex-col-reverse items-center justify-start">
            {scoops.length === 0 && (
              <span className="text-xs text-slate-300">tap a flavor</span>
            )}
            {scoops.map((id, i) => {
              const f = FLAVORS.find((x) => x.id === id)!;
              return (
                <div
                  key={i}
                  className={`-mb-1 h-6 w-12 animate-pop-in rounded-full ring-1 ring-white ${f.scoop}`}
                />
              );
            })}
          </div>
          <div className="h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-amber-700" />
        </div>

        <span className="text-3xl font-extrabold text-slate-300">=</span>

        {/* Distribution: bins */}
        <div className="flex flex-col items-center">
          <span className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Flavor bins
          </span>
          <div className="flex gap-3">
            {FLAVORS.map((f, i) => (
              <div key={f.id} className="flex flex-col items-center gap-1">
                <div className="flex h-16 w-12 flex-col-reverse items-center gap-0.5 rounded-b-xl rounded-t-md border-2 border-slate-300 bg-slate-50 p-1">
                  {Array.from({ length: counts[i] }, (_, j) => (
                    <span
                      key={j}
                      className={`h-3.5 w-full animate-pop-in rounded ${f.scoop}`}
                    />
                  ))}
                </div>
                <span className={`h-3 w-3 rounded-full ${f.dot}`} />
                <span className="text-lg font-extrabold text-slate-700">
                  {counts[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Readout */}
      <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-center text-[13px] text-slate-300">
        {done ? (
          <>
            Choosing{" "}
            <b className="text-white">
              ({counts[0]} vanilla, {counts[1]} choc)
            </b>{" "}
            <i>is</i> distributing 3 scoops into 2 bins — one and the same count.
          </>
        ) : (
          <>A selection of scoops is just a way to fill the flavor-bins.</>
        )}
      </div>

      {scoops.length > 0 && !done && (
        <button
          onClick={() => setScoops([])}
          className="btn-ghost mt-3 w-full"
        >
          Reset
        </button>
      )}
    </div>
  );
}
