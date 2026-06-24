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

function name(id: string) {
  return PEOPLE.find((p) => p.id === id)!.name;
}

export default function SelectTeam({ slide, onComplete }: CustomSlideProps) {
  // `picked` keeps tap ORDER; the team is the sorted set of the same ids.
  const [picked, setPicked] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const full = picked.length === K;
  const teamSet = [...picked].sort();

  function toggle(id: string) {
    if (solved) return;
    setPicked((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= K) return sel;
      const next = [...sel, id];
      if (next.length === K) {
        setSolved(true);
        onComplete();
      }
      return next;
    });
  }

  function shuffleTaps() {
    setPicked((sel) => {
      const a = [...sel];
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
        {slide.title ?? "Pick the team"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Pick any <b>3</b> of these 5 friends for a team. The <b>order</b> you tap
        them in doesn't matter — a team is just a <i>set</i> of people.
      </p>

      {/* People */}
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {PEOPLE.map((p) => {
          const on = picked.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`relative flex h-16 w-16 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm transition active:scale-95 ${p.color} ${
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

      {/* Tap order vs. the set */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-slate-100 bg-white p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Tap order
          </p>
          <p className="mt-2 text-[15px] font-bold text-slate-600">
            {picked.length ? picked.map(name).join(" → ") : "—"}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-500">
            Team (set)
          </p>
          <p className="mt-2 text-[15px] font-bold text-brand-700">
            {picked.length ? `{ ${teamSet.map(name).join(", ")} }` : "{ }"}
          </p>
        </div>
      </div>

      {full ? (
        <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-center text-white">
          <p className="text-sm">
            Same three people, <b>any</b> tap order → the same team. That's a{" "}
            <b className="text-emerald-300">combination</b>, written{" "}
            <b className="text-emerald-300">C(5, 3)</b>.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={shuffleTaps}
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold ring-1 ring-white/20 transition active:scale-95"
            >
              Shuffle tap order
            </button>
            <button
              onClick={() => {
                setPicked([]);
                setSolved(false);
              }}
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold ring-1 ring-white/20 transition active:scale-95"
            >
              Pick again
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-slate-400">
          {picked.length}/{K} picked — tap {K - picked.length} more.
        </p>
      )}
    </div>
  );
}
