import { useState } from "react";
import type { CustomSlideProps } from "./registry";

/**
 * Lesson 4, slide 1: two phases in one:
 *   1. Pick a 3-person team from 5 friends (a combination). Choosing the third
 *      LOCKS the team.
 *   2. Build every ordering of that locked team. All 3! = 6 orderings are the
 *      same team, which is exactly why a combination divides out the orderings.
 * Completes once all six orderings are built and the learner enters 3! = 6.
 */

type Person = { id: string; name: string; color: string };

const PEOPLE: Person[] = [
  { id: "ana", name: "Ana", color: "bg-rose-400" },
  { id: "bo", name: "Bo", color: "bg-brand-400" },
  { id: "cy", name: "Cy", color: "bg-amber-400" },
  { id: "di", name: "Di", color: "bg-umber-400" },
  { id: "eve", name: "Eve", color: "bg-emerald-400" },
];

const K = 3;
const TOTAL = 6; // 3!

function person(id: string) {
  return PEOPLE.find((p) => p.id === id)!;
}
function keyOf(ids: string[]) {
  return ids.join("-");
}
function permutationsOf(ids: string[]): string[][] {
  if (ids.length <= 1) return [ids];
  const out: string[][] = [];
  ids.forEach((v, i) => {
    const rest = [...ids.slice(0, i), ...ids.slice(i + 1)];
    for (const p of permutationsOf(rest)) out.push([v, ...p]);
  });
  return out;
}

export default function SelectTeam({ slide, onComplete }: CustomSlideProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const locked = picked.length === K;
  const team = picked.map(person);

  // Phase 2 (orderings) state.
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null]);
  const [found, setFound] = useState<string[]>([]);
  const [dup, setDup] = useState(false);
  const [base, setBase] = useState("");
  const [result, setResult] = useState("");
  const [solved, setSolved] = useState(false);

  const rowFull = slots.every((s) => s !== null);
  const allFound = found.length === TOTAL;
  const baseOk = base.trim() !== "" && Number(base) === 3;
  const resultOk = result.trim() !== "" && Number(result) === 6;

  function nameOf(id: string) {
    return person(id).name;
  }

  function toggle(id: string) {
    if (locked) return; // selection locks once the team is full
    setPicked((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id],
    );
  }

  function tapToken(id: string) {
    if (solved || rowFull || slots.includes(id)) return;
    setDup(false);
    setSlots((prev) => {
      const idx = prev.indexOf(null);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = id;
      return next;
    });
  }
  function resetRow() {
    if (solved) return;
    setDup(false);
    setSlots([null, null, null]);
  }
  function autoComplete() {
    if (solved) return;
    setFound(permutationsOf(picked).map((ids) => keyOf(ids)));
    setSlots([null, null, null]);
    setDup(false);
  }
  function addOrdering() {
    if (solved || !rowFull) return;
    const key = keyOf(slots as string[]);
    if (found.includes(key)) {
      setDup(true);
      setSlots([null, null, null]);
      return;
    }
    setFound((f) => [...f, key]);
    setSlots([null, null, null]);
    setDup(false);
  }

  function tryFinish(nextBaseOk: boolean, nextResultOk: boolean) {
    if (allFound && nextBaseOk && nextResultOk && !solved) {
      setSolved(true);
      onComplete();
    }
  }
  function onBase(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 1);
    setBase(d);
    tryFinish(d !== "" && Number(d) === 3, resultOk);
  }
  function onResult(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 2);
    setResult(d);
    tryFinish(baseOk, d !== "" && Number(d) === 6);
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Pick a team, then order it"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        {locked ? (
          <>
            Locked in: <b>{team.map((p) => p.name).join(", ")}</b>. These three are
            one team no matter how you arrange them. Now build <i>every</i> order
            you could line them up in.
          </>
        ) : (
          <>
            Pick any <b>{K}</b> of these 5 friends for a team. Order doesn't
            matter, a team is just a <i>set</i>. The third pick locks it in.
          </>
        )}
      </p>

      {/* Phase 1: choose the team */}
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {PEOPLE.map((p) => {
          const on = picked.includes(p.id);
          const dim = locked && !on;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              disabled={locked}
              className={`relative flex h-16 w-16 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm transition active:scale-95 ${p.color} ${
                on ? "ring-4 ring-brand-300" : dim ? "opacity-30" : "opacity-80"
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

      {!locked ? (
        <p className="mt-4 text-center text-xs text-stone-400">
          {picked.length}/{K} picked, tap {K - picked.length} more.
        </p>
      ) : (
        <>
          <p className="mt-4 text-center text-[13px] text-stone-500">
            Same three people, in any order.
          </p>

          {/* Phase 2: build every ordering */}
          <div className="mt-4 flex justify-center gap-2.5">
            {team.map((p) => {
              const used = slots.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => tapToken(p.id)}
                  disabled={solved || rowFull || used}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm transition active:scale-95 ${p.color} ${
                    used || rowFull ? "opacity-30" : "opacity-100"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {slots.map((s, i) => (
              <div
                key={i}
                className={`flex h-12 w-16 items-center justify-center rounded-xl border-2 text-sm font-bold ${
                  s
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-dashed border-stone-300 bg-white text-stone-300"
                }`}
              >
                {s ? nameOf(s) : i + 1}
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={addOrdering}
              disabled={!rowFull || solved}
              className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-40"
            >
              Add
            </button>
            <button
              onClick={resetRow}
              disabled={solved || slots.every((s) => s === null)}
              className="rounded-full bg-stone-100 px-4 py-1.5 text-sm font-bold text-stone-500 transition active:scale-95 disabled:opacity-40"
            >
              Reset
            </button>
            <button
              onClick={autoComplete}
              disabled={solved || allFound}
              className="rounded-full border-2 border-brand-200 px-4 py-1.5 text-sm font-bold text-brand-600 transition active:scale-95 disabled:opacity-40"
            >
              Fill rest
            </button>
          </div>

          {dup && !solved && (
            <p className="mt-2 text-center text-xs font-semibold text-amber-600">
              You already have that ordering. Try a different arrangement.
            </p>
          )}

          <div className="mt-4">
            <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-stone-400">
              Orderings found · {found.length} / {TOTAL}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {found.map((k) => (
                <div
                  key={k}
                  className="flex animate-pop-in items-center justify-center gap-1 rounded-xl border-2 border-stone-100 bg-white p-2 text-xs font-bold text-stone-600"
                >
                  {k.split("-").map((id, i) => (
                    <span key={id} className="flex items-center gap-1">
                      {i > 0 && <span className="text-stone-300">→</span>}
                      {nameOf(id)}
                    </span>
                  ))}
                </div>
              ))}
              {Array.from({ length: TOTAL - found.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[40px] rounded-xl border-2 border-dashed border-stone-100 bg-stone-50"
                />
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-stone-900 p-5 text-center text-white">
            <p className="text-base font-extrabold text-brand-200">
              Every team has k! orderings.
            </p>
            {allFound && (
              <div className="mt-3 flex flex-wrap items-end justify-center gap-2 text-2xl font-extrabold">
                <Field
                  label="factorial base"
                  value={base}
                  onChange={onBase}
                  correct={baseOk}
                  solved={solved}
                  width="w-12"
                />
                <span>! =</span>
                <Field
                  label="total orderings"
                  value={result}
                  onChange={onResult}
                  correct={resultOk}
                  solved={solved}
                  width="w-16"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  correct,
  solved,
  width,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  correct: boolean;
  solved: boolean;
  width: string;
}) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        disabled={solved}
        className={`${width} rounded-lg px-1 py-1 text-center text-2xl font-extrabold outline-none transition ${
          correct
            ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
            : value.trim() !== ""
              ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
              : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
        }`}
      />
    </span>
  );
}
