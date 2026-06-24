import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

const TOTAL = 3;
const FLAVORS = [
  { id: "van", name: "Vanilla", color: "bg-amber-200", text: "text-amber-900" },
  { id: "choc", name: "Choc", color: "bg-amber-800", text: "text-white" },
];

export default function TwoStories({ slide, onComplete }: CustomSlideProps) {
  const [scoops, setScoops] = useState<string[]>([]);

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const counts = FLAVORS.map(
    (f) => scoops.filter((s) => s === f.id).length,
  );
  const done = scoops.length === TOTAL;

  function add(id: string) {
    if (done) return;
    setScoops((s) => [...s, id]);
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Two stories, one count"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Choose 3 scoops from 2 flavors (repeats allowed). <b>Choosing</b> which
        scoops is the same as <b>distributing</b> 3 scoops into flavor-bins.
      </p>

      <div className="mt-4 flex justify-center gap-2.5">
        {FLAVORS.map((f) => (
          <button
            key={f.id}
            onClick={() => add(f.id)}
            disabled={done}
            className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition active:scale-95 disabled:opacity-40 ${f.color} ${f.text}`}
          >
            <span className="h-3 w-3 rounded-full bg-current opacity-70" />+
            {f.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {/* Choice */}
        <div className="rounded-2xl border-2 border-slate-100 bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Choice
          </p>
          <p className="text-[12px] text-slate-500">which 3 scoops?</p>
          <div className="mt-3 flex flex-col-reverse items-center">
            {scoops.length === 0 && (
              <span className="text-xs text-slate-300">tap a flavor</span>
            )}
            {scoops.map((id, i) => {
              const f = FLAVORS.find((x) => x.id === id)!;
              return (
                <div
                  key={i}
                  className={`-mb-1 h-5 w-10 animate-pop-in rounded-full ring-1 ring-white ${f.color}`}
                />
              );
            })}
            <div className="mt-1 h-0 w-0 border-x-[8px] border-t-[14px] border-x-transparent border-t-amber-700" />
          </div>
        </div>

        {/* Distribution */}
        <div className="rounded-2xl border-2 border-slate-100 bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Distribution
          </p>
          <p className="text-[12px] text-slate-500">how many per flavor?</p>
          <div className="mt-3 flex justify-around">
            {FLAVORS.map((f, i) => (
              <div key={f.id} className="flex flex-col items-center gap-1">
                <span className={`h-3 w-3 rounded-full ${f.color}`} />
                <span className="text-2xl font-extrabold text-slate-700">
                  {counts[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-center text-[13px] text-slate-300">
        {done ? (
          <>
            Your pick <b className="text-white">({counts[0]} van, {counts[1]} choc)</b>{" "}
            is one selection <i>and</i> one distribution — same thing.
          </>
        ) : (
          <>A selection of scoops is just a way of distributing them into bins.</>
        )}
      </div>

      {scoops.length > 0 && (
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
