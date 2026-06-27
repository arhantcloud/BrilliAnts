import { useState } from "react";
import type { CustomSlideProps } from "./registry";

/**
 * Lesson 4: the "collapse" idea across the whole (small) sample space.
 * Every ordered pick of 2 from 4 people is laid out, grouped so each box holds
 * the 2! = 2 orderings of the SAME team. Collapsing morphs each box in place
 * from its 2 orderings down to one team, revealing C(4,2) teams. The learner
 * then fills in k to complete C(n, k) = P(n, k) / k!.
 */

const N = 4;
const K = 2;
const P = 12; // P(4,2) = 4·3
const RESULT = 6; // C(4,2) = 12 / 2!

type Person = { id: string; label: string; color: string };
const PEOPLE: Person[] = [
  { id: "a", label: "A", color: "bg-rose-400" },
  { id: "b", label: "B", color: "bg-brand-400" },
  { id: "c", label: "C", color: "bg-amber-400" },
  { id: "d", label: "D", color: "bg-umber-400" },
];

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  const [head, ...tail] = arr;
  const withHead = combinations(tail, k - 1).map((c) => [head, ...c]);
  return [...withHead, ...combinations(tail, k)];
}
function permute<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((v, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permute(rest)) out.push([v, ...p]);
  });
  return out;
}

const GROUPS = combinations(PEOPLE, K).map((combo) => ({
  combo,
  orderings: permute(combo),
}));

function Badge({ p, big }: { p: Person; big?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-md font-bold text-white ${p.color} ${
        big ? "h-8 w-8 text-sm" : "h-6 w-6 text-xs"
      }`}
    >
      {p.label}
    </span>
  );
}

export default function CollapseOrderings({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [k, setK] = useState("");
  const [solved, setSolved] = useState(false);

  const kCorrect = k.trim() !== "" && Number(k) === K;

  function onK(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 1);
    setK(d);
    if (d !== "" && Number(d) === K) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Collapse the orderings"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        How many ways are there to choose a team of {K} from {N} people? Order
        doesn't matter, so <b>A B</b> and <b>B A</b> are the same team. Below is
        every <i>ordered</i> pick, grouped by team, collapse to find out.
      </p>

      <div className="mt-5 rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-100">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
            {collapsed ? `${RESULT} teams` : `${P} ordered picks`}
          </p>
          <p className="text-[11px] font-semibold text-stone-500">
            {collapsed ? "1 per group" : `groups of ${K}!`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {GROUPS.map((g) => {
            const key = g.combo.map((p) => p.id).join("");
            return (
              <div
                key={key}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 bg-white p-2 transition-colors ${
                  collapsed ? "border-brand-200" : "border-stone-100"
                }`}
              >
                {collapsed ? (
                  <div className="flex animate-pop-in gap-0.5">
                    {g.combo.map((p) => (
                      <Badge key={p.id} p={p} big />
                    ))}
                  </div>
                ) : (
                  g.orderings.map((order, oi) => (
                    <div key={oi} className="flex animate-fade-in gap-0.5">
                      {order.map((p) => (
                        <Badge key={p.id} p={p} />
                      ))}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mt-3 w-full rounded-full bg-stone-900 px-4 py-1.5 text-sm font-bold text-white transition active:scale-95"
        >
          {collapsed
            ? "Show all orderings"
            : "Collapse each group into one team"}
        </button>
      </div>

      {/* C(n, k) = P(n, k) / k!  (learner fills in k) */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-2xl font-extrabold text-stone-800">
        <span>
          C({N}, {K}) =
        </span>
        <div className="flex flex-col items-center">
          <span className="pb-1.5">
            P({N}, {K})
          </span>
          <span className="h-1 w-full min-w-[130px] rounded bg-stone-800" />
          <span className="flex items-end gap-0.5 pt-1.5">
            <input
              type="text"
              inputMode="numeric"
              aria-label="value of k"
              value={k}
              onChange={(e) => onK(e.target.value)}
              placeholder="?"
              disabled={solved}
              className={`w-12 rounded-lg border-2 px-1 py-1 text-center text-2xl font-extrabold outline-none transition ${
                kCorrect
                  ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                  : k.trim() !== ""
                    ? "border-red-400 bg-red-50 text-red-500"
                    : "border-dashed border-stone-300 bg-white text-stone-800 focus:border-brand-400"
              }`}
            />
            <span>!</span>
          </span>
        </div>
      </div>

      {solved ? (
        <div className="mt-5 rounded-2xl bg-stone-900 p-5 text-center text-white">
          <p className="animate-fade-in text-xl font-extrabold tracking-wide">
            C({N}, {K}) ={" "}
            <span className="text-emerald-300">
              {P} / {K}! = {P} / 2
            </span>{" "}
            = {RESULT}
          </p>
          <p className="mt-2 text-[13px] text-stone-300">
            Every team is counted {K}! = 2 times among the {P} ordered picks, so
            divide P(n, k) by k! to collapse them into {RESULT} teams.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-stone-400">
          How many orderings does each team of {K} have? That count is the{" "}
          <b>k</b> in k!.
        </p>
      )}
    </div>
  );
}
