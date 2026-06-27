import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { CustomSlideProps } from "./registry";

type CellId = "permutations" | "sequences" | "combinations" | "multisets";

type Cell = {
  id: CellId;
  name: string;
  /** Light hint shown in the empty box. */
  props: string;
};

/** 2x2 layout order: row-major, matching the map from slide 1. */
const CELLS: Cell[] = [
  { id: "permutations", name: "Permutations", props: "order matters · no repeats" },
  { id: "sequences", name: "Sequences", props: "order matters · repeats ok" },
  { id: "combinations", name: "Combinations", props: "order ignored · no repeats" },
  { id: "multisets", name: "Multisets", props: "order ignored · repeats ok" },
];

const CELL_NAME: Record<CellId, string> = {
  permutations: "Permutations",
  sequences: "Sequences",
  combinations: "Combinations",
  multisets: "Multisets",
};

type Example = {
  id: string;
  label: string;
  correctCell: CellId;
  /** Plain-language description of its two properties. */
  desc: string;
  Visual: () => JSX.Element;
};

const EXAMPLES: Example[] = [
  {
    id: "pin",
    label: "4-digit PIN",
    correctCell: "sequences",
    desc: "order matters and digits can repeat",
    Visual: PinVisual,
  },
  {
    id: "podium",
    label: "Race podium",
    correctCell: "permutations",
    desc: "order matters and nobody repeats",
    Visual: PodiumVisual,
  },
  {
    id: "team",
    label: "Pick a 3-person team",
    correctCell: "combinations",
    desc: "order doesn't matter and nobody repeats",
    Visual: TeamVisual,
  },
  {
    id: "icecream",
    label: "Scoops of ice cream",
    correctCell: "multisets",
    desc: "order doesn't matter and flavors can repeat",
    Visual: IceCreamVisual,
  },
];

type Placements = Record<string, CellId | null>;

export default function ClassifyExamples({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [placements, setPlacements] = useState<Placements>(() =>
    Object.fromEntries(EXAMPLES.map((e) => [e.id, null])),
  );
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hoverCell, setHoverCell] = useState<CellId | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const allPlaced = EXAMPLES.every((e) => placements[e.id] != null);
  const allCorrect = EXAMPLES.every((e) => placements[e.id] === e.correctCell);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (solved) return;
    const { active, over } = event;
    if (!over) return;
    const exampleId = String(active.id);
    const target = String(over.id);
    setPlacements((p) => ({
      ...p,
      [exampleId]: target === "tray" ? null : (target as CellId),
    }));
    setChecked(false);
  }

  function check() {
    if (!allPlaced) return;
    setChecked(true);
    if (allCorrect) {
      setSolved(true);
      onComplete();
    }
  }

  const trayExamples = EXAMPLES.filter((e) => placements[e.id] == null);
  const activeExample = EXAMPLES.find((e) => e.id === activeId);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Sort each example"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Drag each example into the category it belongs to.
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Tray of unplaced examples (drag from here) */}
        <Tray>
          {trayExamples.map((e) => (
            <DraggableExample key={e.id} example={e} disabled={solved} />
          ))}
          {trayExamples.length === 0 && (
            <p className="py-3 text-center text-xs text-stone-400">
              All examples placed. Check your answer.
            </p>
          )}
        </Tray>

        {/* 2x2 grid of droppable categories */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {CELLS.map((cell) => {
            const inCell = EXAMPLES.filter(
              (e) => placements[e.id] === cell.id,
            );
            const wrongExample = checked
              ? inCell.find((e) => e.correctCell !== cell.id)
              : undefined;
            return (
              <DroppableCell
                key={cell.id}
                cell={cell}
                empty={inCell.length === 0}
                wrong={Boolean(wrongExample)}
                correct={checked && inCell.length > 0 && !wrongExample}
                showTooltip={hoverCell === cell.id && Boolean(wrongExample)}
                tooltip={
                  wrongExample
                    ? `${wrongExample.label}: ${wrongExample.desc}. That's ${CELL_NAME[wrongExample.correctCell]}, not ${cell.name}.`
                    : ""
                }
                onHoverChange={(on) => setHoverCell(on ? cell.id : null)}
              >
                {inCell.map((e) => (
                  <DraggableExample
                    key={e.id}
                    example={e}
                    placed
                    disabled={solved}
                  />
                ))}
              </DroppableCell>
            );
          })}
        </div>

        {/* Rendered in a portal so the dragged card always stays on top. */}
        <DragOverlay dropAnimation={null}>
          {activeExample ? (
            <ExampleCardBody example={activeExample} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {checked && !allCorrect && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Not quite</p>
          <p className="mt-0.5">
            The red categories have a misplaced example. Hover (or tap) a red
            box to see why.
          </p>
        </div>
      )}
      {solved && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-bold">All correct!</p>
          <p className="mt-0.5">
            Two yes/no questions (order and replacement) place every problem.
          </p>
        </div>
      )}

      {!solved && (
        <button
          onClick={check}
          disabled={!allPlaced}
          className="btn-primary mt-5 w-full"
        >
          Check answer
        </button>
      )}
    </div>
  );
}

function Tray({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "tray" });
  return (
    <div
      ref={setNodeRef}
      className={`mt-3 flex min-h-[96px] flex-wrap items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-3 transition ${
        isOver ? "border-brand-300 bg-brand-50" : "border-stone-200 bg-stone-50"
      }`}
    >
      {children}
    </div>
  );
}

function DroppableCell({
  cell,
  empty,
  wrong,
  correct,
  showTooltip,
  tooltip,
  onHoverChange,
  children,
}: {
  cell: Cell;
  empty: boolean;
  wrong: boolean;
  correct: boolean;
  showTooltip: boolean;
  tooltip: string;
  onHoverChange: (on: boolean) => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cell.id });

  let border = "border-stone-200 bg-white";
  if (wrong) border = "border-red-400 bg-red-50";
  else if (correct) border = "border-emerald-400 bg-emerald-50";
  else if (isOver) border = "border-brand-400 bg-brand-50";

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onClick={() => onHoverChange(!showTooltip)}
      className={`relative flex min-h-[120px] flex-col rounded-2xl border-2 p-2 transition ${border}`}
    >
      <span className="text-center text-[12px] font-bold text-stone-700">
        {cell.name}
      </span>
      <span className="mb-1.5 text-center text-[9px] font-medium text-stone-400">
        {cell.props}
      </span>
      <div className="flex flex-1 flex-wrap content-start items-start justify-center gap-1.5">
        {empty && (
          <span className="mt-2 text-[10px] text-stone-300">Drop here</span>
        )}
        {children}
      </div>
      {showTooltip && tooltip && (
        <div className="absolute inset-x-1 bottom-1 z-10 animate-fade-in rounded-lg bg-stone-900 px-2.5 py-2 text-[11px] font-medium leading-snug text-white shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  );
}

function DraggableExample({
  example,
  placed,
  disabled,
}: {
  example: Example;
  placed?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: example.id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none select-none ${
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-30" : "opacity-100"}`}
    >
      <ExampleCardBody example={example} placed={placed} />
    </div>
  );
}

/** Presentational card shared by the in-place draggable and the drag overlay. */
function ExampleCardBody({
  example,
  placed,
  dragging,
}: {
  example: Example;
  placed?: boolean;
  dragging?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border-2 border-stone-200 bg-white ${
        dragging ? "rotate-2 shadow-xl" : "shadow-sm"
      } ${placed ? "w-[88px]" : "w-[96px]"}`}
    >
      <div className="flex h-12 items-center justify-center overflow-hidden rounded-t-[10px] bg-stone-100">
        <example.Visual />
      </div>
      <p className="px-1 py-1 text-center text-[10px] font-bold leading-tight text-stone-700">
        {example.label}
      </p>
    </div>
  );
}

/* ----------------------------- Animated visuals ---------------------------- */

function DigitReel({ duration, start }: { duration: string; start: number }) {
  // Strip of 0-9 starting at `start`, repeated once so the loop is seamless.
  const single = Array.from({ length: 10 }, (_, i) => (start + i) % 10);
  return (
    <div className="h-7 w-4 overflow-hidden rounded bg-stone-800">
      <div
        className="flex animate-reel flex-col items-center"
        style={{ animationDuration: duration }}
      >
        {[...single, ...single].map((d, i) => (
          <span
            key={i}
            className="flex h-7 w-4 items-center justify-center text-[11px] font-bold text-white"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function PinVisual() {
  return (
    <div className="flex items-center gap-1">
      <DigitReel duration="3s" start={3} />
      <DigitReel duration="3.8s" start={7} />
      <DigitReel duration="3.4s" start={1} />
      <DigitReel duration="4.2s" start={9} />
    </div>
  );
}

function PodiumVisual() {
  // Ranked steps (order matters). Runners swap out/in to hint that a different
  // arrangement is a different outcome. Color comes from the swap keyframe.
  const bars = [
    { bar: "bg-stone-200", swap: "animate-swap1", h: 22, pos: 2, delay: "0.15s" },
    { bar: "bg-amber-300", swap: "animate-swap2", h: 34, pos: 1, delay: "0s" },
    { bar: "bg-orange-200", swap: "animate-swap3", h: 14, pos: 3, delay: "0.3s" },
  ];
  return (
    <div className="flex h-11 items-end justify-center gap-1">
      {bars.map((b) => (
        <div key={b.pos} className="flex flex-col items-center justify-end">
          <span className={`mb-0.5 h-2.5 w-2.5 rounded-full ${b.swap}`} />
          <div
            className={`flex w-4 origin-bottom animate-grow items-start justify-center rounded-t ${b.bar}`}
            style={{ height: `${b.h}px`, animationDelay: b.delay }}
          >
            <span className="text-[8px] font-bold text-stone-600">{b.pos}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamVisual() {
  // Five different people; three get chosen (order doesn't matter, no repeats).
  const members = [
    { color: "bg-rose-400", selected: true },
    { color: "bg-brand-400", selected: false },
    { color: "bg-amber-400", selected: true },
    { color: "bg-umber-400", selected: true },
    { color: "bg-emerald-400", selected: false },
  ];
  return (
    <div className="flex items-center justify-center gap-1">
      {members.map((m, i) => (
        <div key={i} className="relative">
          <div className={`h-4 w-4 rounded-full ${m.color}`} />
          {m.selected && (
            <span
              className="absolute -right-1 -top-1 flex h-3 w-3 animate-blink items-center justify-center rounded-full bg-emerald-600 text-[7px] font-bold text-white"
              style={{ animationDelay: `${i * 0.25}s` }}
            >
              ✓
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function IceCreamVisual() {
  // Three coordinated schedules: exactly two scoops always match (repeats =
  // multiset), and which pair matches rotates over time.
  const scoops = ["animate-scoopA", "animate-scoopB", "animate-scoopC"];
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col-reverse items-center">
        {scoops.map((anim, i) => (
          <div
            key={i}
            className={`-mb-1.5 h-3.5 w-3.5 rounded-full ring-1 ring-white ${anim}`}
          />
        ))}
      </div>
      <div className="mt-1 h-0 w-0 border-x-[7px] border-t-[12px] border-x-transparent border-t-amber-700" />
    </div>
  );
}
