import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";
import { Readout } from "./ui";

type Sym = { id: string; label: string; color: string };

const SYMBOLS: Sym[] = [
  { id: "star", label: "★", color: "bg-amber-400" },
  { id: "heart", label: "♥", color: "bg-rose-400" },
  { id: "moon", label: "☾", color: "bg-sky-400" },
  { id: "bolt", label: "⚡", color: "bg-violet-400" },
];

const N = SYMBOLS.length;
const SLOTS = 3;

export default function RefillChoices({ slide, onComplete }: CustomSlideProps) {
  const [slots, setSlots] = useState<(string | null)[]>(
    Array(SLOTS).fill(null),
  );

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const activeIndex = slots.findIndex((s) => s === null);
  const filledCount = slots.filter((s) => s !== null).length;
  const done = filledCount === SLOTS;

  function fill(symId: string) {
    if (done) return;
    setSlots((s) => {
      const idx = s.findIndex((x) => x === null);
      if (idx === -1) return s;
      const next = [...s];
      next[idx] = symId;
      return next;
    });
  }

  function sym(id: string) {
    return SYMBOLS.find((s) => s.id === id)!;
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Choices that don't run out"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Build a 3-symbol passcode from these 4 symbols. You can reuse a symbol —
        so every slot still has <b>all {N}</b> choices. Tap to fill.
      </p>

      {/* Slots */}
      <div className="mt-5 flex justify-center gap-2.5">
        {slots.map((id, i) => {
          const active = i === activeIndex;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  active ? "bg-brand-500 text-white" : "text-transparent"
                }`}
              >
                {N} choices
              </span>
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-3xl text-white transition ${
                  id
                    ? "border-transparent " + sym(id).color
                    : active
                      ? "border-brand-400 bg-brand-50"
                      : "border-dashed border-slate-200 bg-slate-50"
                }`}
              >
                {id && (
                  <span className="animate-pop-in">{sym(id).label}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Palette — always full (reuse allowed) */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {SYMBOLS.map((s) => (
          <button
            key={s.id}
            onClick={() => fill(s.id)}
            disabled={done}
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-white shadow-sm transition active:scale-95 disabled:opacity-40 ${s.color}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Readout>
        {filledCount === 0 ? (
          <p className="text-sm text-slate-400">
            Each slot has {N} choices — and it stays {N} even after you pick.
          </p>
        ) : (
          <>
            <p className="text-2xl font-extrabold tracking-wide">
              {Array(filledCount).fill(N).join(" × ")}
              {!done && <span className="text-slate-500"> × …</span>}
              {done && <span className="text-brand-300"> = {N ** SLOTS}</span>}
            </p>
            <p className="mt-2 text-[13px] text-slate-300">
              {done
                ? `${N ** SLOTS} possible passcodes — that's nᵏ = ${N}³.`
                : `The pool never shrinks: still ${N} choices for the next slot.`}
            </p>
          </>
        )}
      </Readout>

      {filledCount > 0 && (
        <button
          onClick={() => setSlots(Array(SLOTS).fill(null))}
          className="btn-ghost mt-3 w-full"
        >
          Reset
        </button>
      )}
    </div>
  );
}
