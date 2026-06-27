import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CustomSlideProps } from "./registry";

/**
 * Connect-the-dots matching slide: draw a line from each two-property
 * description to the counting family it names. Completes once all four lines are
 * correct. (Lesson 1, slide 3.)
 */

type Family = { id: string; name: string; order: string; rep: string };

/** The four families. A description connects to the family with the same id. */
const FAMILIES: Family[] = [
  { id: "perm", name: "Permutations", order: "Order matters", rep: "No replacement" },
  { id: "seq", name: "Sequences", order: "Order matters", rep: "With replacement" },
  { id: "comb", name: "Combinations", order: "Order doesn't matter", rep: "No replacement" },
  { id: "multi", name: "Multisets", order: "Order doesn't matter", rep: "With replacement" },
];

/** Left column = descriptions, right column = names (deliberately scrambled). */
const LEFT = FAMILIES;
const RIGHT_ORDER = ["comb", "multi", "perm", "seq"];
const RIGHT = RIGHT_ORDER.map((id) => FAMILIES.find((f) => f.id === id)!);

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

type Line = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  correct: boolean;
};

export default function ConnectCategories({ slide, onComplete }: CustomSlideProps) {
  const [sel, setSel] = useState<{ side: "l" | "r"; id: string } | null>(null);
  // leftId -> rightId
  const [conns, setConns] = useState<Record<string, string>>({});
  const [solved, setSolved] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lines, setLines] = useState<Line[]>([]);
  const [tick, setTick] = useState(0);

  function connect(leftId: string, rightId: string) {
    if (solved) return;
    setConns((prev) => {
      const next: Record<string, string> = {};
      // Keep mappings except any that conflict with the new pair (one-to-one).
      for (const [l, r] of Object.entries(prev)) {
        if (l === leftId || r === rightId) continue;
        next[l] = r;
      }
      next[leftId] = rightId;
      return next;
    });
    setSel(null);
  }

  function tapLeft(id: string) {
    if (solved) return;
    if (sel?.side === "r") connect(id, sel.id);
    else setSel({ side: "l", id });
  }
  function tapRight(id: string) {
    if (solved) return;
    if (sel?.side === "l") connect(sel.id, id);
    else setSel({ side: "r", id });
  }
  function reset() {
    if (solved) return;
    setConns({});
    setSel(null);
  }

  // Complete when every description is wired to its matching name.
  useEffect(() => {
    if (solved) return;
    const allCorrect = LEFT.every((f) => conns[f.id] === f.id);
    if (allCorrect) {
      setSolved(true);
      onComplete();
    }
  }, [conns, solved, onComplete]);

  // Measure anchor points so the SVG can draw lines between matched nodes.
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

  const matched = Object.keys(conns).length;

  function leftState(id: string): NodeState {
    if (conns[id]) return conns[id] === id ? "correct" : "wrong";
    if (sel?.side === "l" && sel.id === id) return "selected";
    return "idle";
  }
  function rightState(id: string): NodeState {
    const left = Object.entries(conns).find(([, r]) => r === id)?.[0];
    if (left) return left === id ? "correct" : "wrong";
    if (sel?.side === "r" && sel.id === id) return "selected";
    return "idle";
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Connect each description to its name"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Each pair of properties names one counting family. Tap a description,
        then tap the name it matches to connect them.
      </p>

      <div ref={wrapRef} className="relative mt-6">
        {/* line overlay */}
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

        <div className="flex items-stretch justify-between gap-3">
          {/* Descriptions */}
          <div className="flex flex-1 flex-col gap-3">
            {LEFT.map((f) => {
              const state = leftState(f.id);
              return (
                <button
                  key={f.id}
                  ref={(el) => {
                    leftRefs.current[f.id] = el;
                  }}
                  onClick={() => tapLeft(f.id)}
                  disabled={solved}
                  aria-label={`${f.order}, ${f.rep}`}
                  className={`relative flex min-h-[64px] flex-col items-start justify-center rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.98] ${nodeClasses(state)}`}
                >
                  <span className="text-[13px] font-bold leading-tight text-stone-800">
                    {f.order}
                  </span>
                  <span className="text-[12px] font-semibold leading-tight text-stone-500">
                    {f.rep}
                  </span>
                  <span
                    className={`absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white ${
                      state === "correct"
                        ? "bg-emerald-400"
                        : state === "wrong"
                          ? "bg-red-400"
                          : state === "selected"
                            ? "bg-brand-500"
                            : "bg-stone-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Names */}
          <div className="flex flex-1 flex-col gap-3">
            {RIGHT.map((f) => {
              const state = rightState(f.id);
              return (
                <button
                  key={f.id}
                  ref={(el) => {
                    rightRefs.current[f.id] = el;
                  }}
                  onClick={() => tapRight(f.id)}
                  disabled={solved}
                  aria-label={f.name}
                  className={`relative flex min-h-[64px] items-center justify-center rounded-xl border-2 px-3 py-2 text-center transition active:scale-[0.98] ${nodeClasses(state)}`}
                >
                  <span
                    className={`absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white ${
                      state === "correct"
                        ? "bg-emerald-400"
                        : state === "wrong"
                          ? "bg-red-400"
                          : state === "selected"
                            ? "bg-brand-500"
                            : "bg-stone-300"
                    }`}
                  />
                  <span className="text-[14px] font-extrabold text-stone-800">
                    {f.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-stone-500">
          {matched} / 4 connected
        </span>
        {!solved && matched > 0 && (
          <button
            onClick={reset}
            className="rounded-full bg-stone-100 px-4 py-1.5 text-sm font-bold text-stone-600 transition active:scale-95"
          >
            Reset
          </button>
        )}
      </div>

      {solved && (
        <div className="mt-3 animate-fade-in rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-bold">All four matched!</p>
          <p className="mt-0.5">
            Two yes/no questions (does order matter, and can items repeat)
            decide which of the four families you're counting.
          </p>
        </div>
      )}
    </div>
  );
}
