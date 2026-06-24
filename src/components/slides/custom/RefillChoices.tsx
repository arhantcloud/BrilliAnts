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
        <b>How many possible passcodes are there?</b> Build a 3-symbol passcode
        from these 4 symbols. You can reuse a symbol — so every slot still has{" "}
        <b>all {N}</b> choices. Tap the keypad.
      </p>

      {/* Keypad device */}
      <div className="mx-auto mt-5 w-full max-w-[300px] rounded-3xl bg-gradient-to-b from-slate-700 to-slate-900 p-4 shadow-2xl ring-1 ring-black/20">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Enter code
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${
                done ? "bg-emerald-400" : "animate-pulse bg-amber-400"
              }`}
            />
            {done ? "LOCKED" : "OPEN"}
          </span>
        </div>

        {/* Passcode display (LCD) */}
        <div className="rounded-2xl bg-slate-950 p-3 shadow-inner ring-1 ring-white/5">
          <div className="flex items-center justify-center gap-3">
            {slots.map((id, i) => {
              const active = i === activeIndex;
              return (
                <div
                  key={i}
                  className={`flex h-16 w-14 items-center justify-center rounded-xl text-3xl transition ${
                    id
                      ? `text-white shadow-lg ${sym(id).color}`
                      : active
                        ? "bg-slate-800 ring-2 ring-brand-400"
                        : "bg-slate-900 ring-1 ring-slate-700"
                  }`}
                >
                  {id ? (
                    <span className="animate-pop-in drop-shadow">
                      {sym(id).label}
                    </span>
                  ) : (
                    <span
                      className={`text-lg ${
                        active ? "animate-pulse text-brand-300" : "text-slate-600"
                      }`}
                    >
                      ●
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {!done && (
            <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wide text-brand-300">
              {N} choices available
            </p>
          )}
        </div>

        {/* Keypad — always full (reuse allowed) */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {SYMBOLS.map((s) => (
            <button
              key={s.id}
              onClick={() => fill(s.id)}
              disabled={done}
              className={`flex h-14 items-center justify-center rounded-2xl text-2xl text-white shadow-lg ring-1 ring-white/20 transition active:scale-95 active:brightness-110 disabled:opacity-40 ${s.color}`}
            >
              {s.label}
            </button>
          ))}
        </div>
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
                ? `${N ** SLOTS} possible passcodes — the pool stayed full the whole time.`
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
