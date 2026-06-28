import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Small tap-to-connect matching widget used as the completion gate on the
 * Lesson 6 distribute-into-bins slides. The learner taps a left item then the
 * right item it pairs with; a left and right that share the same `id` are a
 * correct match. Calls `onSolved` once every pair is connected correctly.
 *
 * Left items are shown in order; right items should be passed pre-scrambled.
 */

type Item = { id: string; title: string; sub?: string };

type Line = { key: string; x1: number; y1: number; x2: number; y2: number; correct: boolean };

type NodeState = "idle" | "selected" | "correct" | "wrong";

function nodeClasses(state: NodeState) {
  switch (state) {
    case "correct":
      return "border-emerald-400 bg-emerald-50";
    case "wrong":
      return "border-red-400 bg-red-50";
    case "selected":
      return "border-brand-500 bg-brand-50 ring-2 ring-brand-200";
    default:
      return "border-stone-200 bg-white hover:border-brand-300";
  }
}

function dotClass(state: NodeState) {
  if (state === "correct") return "bg-emerald-400";
  if (state === "wrong") return "bg-red-400";
  if (state === "selected") return "bg-brand-500";
  return "bg-stone-300";
}

export default function MatchPairs({
  left,
  right,
  disabled,
  onSolved,
}: {
  left: Item[];
  right: Item[];
  disabled?: boolean;
  onSolved: () => void;
}) {
  const [sel, setSel] = useState<{ side: "l" | "r"; id: string } | null>(null);
  const [conns, setConns] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lines, setLines] = useState<Line[]>([]);
  const [tick, setTick] = useState(0);

  const locked = disabled || done;

  function connect(leftId: string, rightId: string) {
    if (locked) return;
    const next: Record<string, string> = {};
    for (const [l, r] of Object.entries(conns)) {
      if (l === leftId || r === rightId) continue;
      next[l] = r;
    }
    next[leftId] = rightId;
    setConns(next);
    setSel(null);
    if (left.length > 0 && left.every((it) => next[it.id] === it.id)) {
      setDone(true);
      onSolved();
    }
  }

  function tapLeft(id: string) {
    if (locked) return;
    if (sel?.side === "r") connect(id, sel.id);
    else setSel({ side: "l", id });
  }
  function tapRight(id: string) {
    if (locked) return;
    if (sel?.side === "l") connect(sel.id, id);
    else setSel({ side: "r", id });
  }

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const box = wrap.getBoundingClientRect();
    const next: Line[] = [];
    for (const [l, r] of Object.entries(conns)) {
      const lb = leftRefs.current[l]?.getBoundingClientRect();
      const rb = rightRefs.current[r]?.getBoundingClientRect();
      if (!lb || !rb) continue;
      next.push({
        key: l,
        x1: lb.right - box.left,
        y1: lb.top + lb.height / 2 - box.top,
        x2: rb.left - box.left,
        y2: rb.top + rb.height / 2 - box.top,
        correct: l === r,
      });
    }
    setLines(next);
  }, [conns, tick]);

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function leftState(id: string): NodeState {
    if (conns[id]) return conns[id] === id ? "correct" : "wrong";
    if (sel?.side === "l" && sel.id === id) return "selected";
    return "idle";
  }
  function rightState(id: string): NodeState {
    const l = Object.entries(conns).find(([, r]) => r === id)?.[0];
    if (l) return l === id ? "correct" : "wrong";
    if (sel?.side === "r" && sel.id === id) return "selected";
    return "idle";
  }

  return (
    <div ref={wrapRef} className="relative">
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {lines.map((ln) => (
          <line
            key={ln.key}
            x1={ln.x1}
            y1={ln.y1}
            x2={ln.x2}
            y2={ln.y2}
            stroke={ln.correct ? "#34d399" : "#f87171"}
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="flex items-stretch justify-between gap-4">
        <div className="flex flex-1 flex-col gap-3">
          {left.map((it) => {
            const state = leftState(it.id);
            return (
              <button
                key={it.id}
                ref={(el) => {
                  leftRefs.current[it.id] = el;
                }}
                type="button"
                onClick={() => tapLeft(it.id)}
                disabled={locked}
                aria-label={it.title}
                className={`relative flex min-h-[56px] flex-col items-start justify-center rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.98] ${nodeClasses(state)}`}
              >
                <span className="text-[13px] font-bold leading-tight text-stone-800">
                  {it.title}
                </span>
                {it.sub && (
                  <span className="text-[11px] font-semibold leading-tight text-stone-500">
                    {it.sub}
                  </span>
                )}
                <span
                  className={`absolute -right-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white ${dotClass(state)}`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          {right.map((it) => {
            const state = rightState(it.id);
            return (
              <button
                key={it.id}
                ref={(el) => {
                  rightRefs.current[it.id] = el;
                }}
                type="button"
                onClick={() => tapRight(it.id)}
                disabled={locked}
                aria-label={it.title}
                className={`relative flex min-h-[56px] flex-col items-end justify-center rounded-xl border-2 px-3 py-2 text-right transition active:scale-[0.98] ${nodeClasses(state)}`}
              >
                <span
                  className={`absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white ${dotClass(state)}`}
                />
                <span className="text-[13px] font-extrabold leading-tight text-stone-800">
                  {it.title}
                </span>
                {it.sub && (
                  <span className="text-[11px] font-semibold leading-tight text-stone-500">
                    {it.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
