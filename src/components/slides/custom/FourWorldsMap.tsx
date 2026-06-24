import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

/** Shapes used to illustrate each property. */
const SHAPES = {
  triangle: { glyph: "▲", color: "text-amber-500" },
  circle: { glyph: "●", color: "text-brand-500" },
  square: { glyph: "■", color: "text-emerald-500" },
} as const;

type ShapeKey = keyof typeof SHAPES;

function ShapeRow({ shapes }: { shapes: ShapeKey[] }) {
  return (
    <div className="flex items-center gap-2 text-3xl leading-none">
      {shapes.map((s, i) => (
        <span key={i} className={SHAPES[s].color}>
          {SHAPES[s].glyph}
        </span>
      ))}
    </div>
  );
}

/** Which axis property is currently being explored. */
type Selection =
  | { axis: "order"; value: "matters" | "ignored" }
  | { axis: "replacement"; value: "with" | "no" };

/** The four cells of the map, addressed by (orderValue, replacementValue). */
const CELLS = {
  matters_no: { name: "Permutations" },
  matters_with: { name: "Sequences" },
  ignored_no: { name: "Combinations" },
  ignored_with: { name: "Multisets" },
} as const;

export default function FourWorldsMap({ slide, onComplete }: CustomSlideProps) {
  const [selection, setSelection] = useState<Selection | null>(null);

  // Light interaction only — no correctness gate. Allow advancing immediately.
  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const orderActive =
    selection?.axis === "order" ? selection.value : null;
  const repActive =
    selection?.axis === "replacement" ? selection.value : null;

  function cellHighlighted(order: "matters" | "ignored", rep: "with" | "no") {
    return order === orderActive || rep === repActive;
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "The four kinds of counting"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Every counting problem is decided by two questions. Tap a label to see
        what it means.
      </p>

      {/* 2x2 map */}
      <div
        className="mt-5 grid animate-fade-in-up gap-2"
        style={{ gridTemplateColumns: "minmax(64px,auto) 1fr 1fr" }}
      >
        {/* Header row */}
        <div />
        <AxisButton
          label="No replacement"
          active={repActive === "no"}
          onClick={() =>
            setSelection({ axis: "replacement", value: "no" })
          }
        />
        <AxisButton
          label="With replacement"
          active={repActive === "with"}
          onClick={() =>
            setSelection({ axis: "replacement", value: "with" })
          }
        />

        {/* Row 1: order matters */}
        <AxisButton
          label="Order matters"
          active={orderActive === "matters"}
          onClick={() => setSelection({ axis: "order", value: "matters" })}
        />
        <Cell
          cell={CELLS.matters_no}
          highlighted={cellHighlighted("matters", "no")}
        />
        <Cell
          cell={CELLS.matters_with}
          highlighted={cellHighlighted("matters", "with")}
        />

        {/* Row 2: order ignored */}
        <AxisButton
          label="Order ignored"
          active={orderActive === "ignored"}
          onClick={() => setSelection({ axis: "order", value: "ignored" })}
        />
        <Cell
          cell={CELLS.ignored_no}
          highlighted={cellHighlighted("ignored", "no")}
        />
        <Cell
          cell={CELLS.ignored_with}
          highlighted={cellHighlighted("ignored", "with")}
        />
      </div>

      {/* Example panel */}
      <ExamplePanel selection={selection} />
    </div>
  );
}

function AxisButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center rounded-xl border-2 px-2 py-2.5 text-center text-xs font-bold leading-tight transition active:scale-[0.97] ${
        active
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
      }`}
    >
      {label}
    </button>
  );
}

function Cell({
  cell,
  highlighted,
}: {
  cell: { name: string };
  highlighted: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border-2 px-2 py-4 text-center transition ${
        highlighted
          ? "border-brand-300 bg-brand-50"
          : "border-slate-100 bg-slate-50"
      }`}
    >
      <span className="text-[13px] font-bold text-slate-800">{cell.name}</span>
    </div>
  );
}

function ExamplePanel({ selection }: { selection: Selection | null }) {
  return (
    <div className="mt-5 min-h-[148px] rounded-2xl bg-slate-900 p-5 text-white">
      {!selection ? (
        <div className="flex h-[108px] items-center justify-center text-center text-sm text-slate-400">
          Tap a label above to see an example.
        </div>
      ) : (
        // key forces the reveal animation to replay on each change
        <div key={`${selection.axis}-${selection.value}`} className="animate-fade-in">
          {selection.axis === "order" ? (
            <OrderExample value={selection.value} />
          ) : (
            <ReplacementExample value={selection.value} />
          )}
        </div>
      )}
    </div>
  );
}

function OrderExample({ value }: { value: "matters" | "ignored" }) {
  const matters = value === "matters";
  return (
    <div>
      <p className="text-sm font-bold text-brand-200">
        {matters ? "Order matters" : "Order ignored"}
      </p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <ShapeRow shapes={["triangle", "circle", "square"]} />
        <span className="text-2xl font-extrabold text-slate-300">
          {matters ? "≠" : "="}
        </span>
        <ShapeRow shapes={["circle", "square", "triangle"]} />
      </div>
      <p className="mt-3 text-center text-[13px] text-slate-300">
        {matters
          ? "Rearrange the same items and it counts as a different outcome."
          : "Same items in any order count as the same outcome."}
      </p>
    </div>
  );
}

function ReplacementExample({ value }: { value: "with" | "no" }) {
  const withRep = value === "with";
  return (
    <div>
      <p className="text-sm font-bold text-brand-200">
        {withRep ? "With replacement" : "No replacement"}
      </p>
      <div className="mt-3 flex items-center justify-center gap-5">
        {withRep ? (
          <Tagged ok label="repeats allowed">
            <ShapeRow shapes={["triangle", "triangle", "triangle"]} />
          </Tagged>
        ) : (
          <>
            <Tagged ok={false} label="can't reuse">
              <ShapeRow shapes={["triangle", "triangle"]} />
            </Tagged>
            <Tagged ok label="all different">
              <ShapeRow shapes={["triangle", "circle", "square"]} />
            </Tagged>
          </>
        )}
      </div>
      <p className="mt-3 text-center text-[13px] text-slate-300">
        {withRep
          ? "The pool never runs out — use the same item as often as you like."
          : "Once an item is used, it's gone — every pick is different."}
      </p>
    </div>
  );
}

function Tagged({
  ok,
  label,
  children,
}: {
  ok: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {children}
      <span
        className={`flex items-center gap-1 text-[11px] font-semibold ${
          ok ? "text-emerald-400" : "text-red-400"
        }`}
      >
        <span>{ok ? "✓" : "✗"}</span>
        {label}
      </span>
    </div>
  );
}
