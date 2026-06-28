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

/**
 * Lesson 6, slide 3: the same 2x2 map from Lesson 1 (Permutations / Sequences /
 * Combinations / Multisets, by order × replacement), but now each cell has a
 * blank slot opposite its name. The learner drags the matching distribution
 * quality (what the balls and bins look like) onto each family:
 *
 *   Order matters  ⇄ numbered (distinguishable) balls
 *   Order ignored  ⇄ identical (indistinguishable) balls
 *   No replacement ⇄ one ball per bin (exclusive)
 *   With repl.     ⇄ bins can be reused
 */

type CellId = "matters_no" | "matters_with" | "ignored_no" | "ignored_with";

const FAMILY: Record<CellId, string> = {
  matters_no: "Permutations",
  matters_with: "Sequences",
  ignored_no: "Combinations",
  ignored_with: "Multisets",
};

type Chip = { id: string; ball: string; bin: string; cell: CellId };

const CHIPS: Chip[] = [
  { id: "num-excl", ball: "Numbered balls", bin: "one per bin", cell: "matters_no" },
  { id: "num-reuse", ball: "Numbered balls", bin: "bins reused", cell: "matters_with" },
  { id: "id-excl", ball: "Identical balls", bin: "one per bin", cell: "ignored_no" },
  { id: "id-reuse", ball: "Identical balls", bin: "bins reused", cell: "ignored_with" },
];

const CHIP_BY_ID: Record<string, Chip> = Object.fromEntries(
  CHIPS.map((c) => [c.id, c]),
);

export default function MapDistribution({ slide, onComplete }: CustomSlideProps) {
  const [placements, setPlacements] = useState<Record<string, CellId | null>>(
    () => Object.fromEntries(CHIPS.map((c) => [c.id, null])),
  );
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const allPlaced = CHIPS.every((c) => placements[c.id] != null);
  const allCorrect = CHIPS.every((c) => placements[c.id] === c.cell);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (solved) return;
    const { active, over } = event;
    if (!over) return;
    const chipId = String(active.id);
    const target = String(over.id);
    setPlacements((prev) => {
      const next = { ...prev };
      if (target === "tray") {
        next[chipId] = null;
        return next;
      }
      // One chip per cell, so bump any current occupant back to the tray.
      for (const c of CHIPS) if (next[c.id] === target) next[c.id] = null;
      next[chipId] = target as CellId;
      return next;
    });
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

  const trayChips = CHIPS.filter((c) => placements[c.id] == null);
  const activeChip = activeId ? CHIP_BY_ID[activeId] : null;
  const chipInCell = (cell: CellId) =>
    CHIPS.find((c) => placements[c.id] === cell) ?? null;

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Two languages, one map"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Same map as the start of the course. Drag each{" "}
        <b>distribution quality</b> onto the family it describes.
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* The 2x2 map, with a blank slot opposite each family name */}
        <div
          className="mt-5 grid gap-2"
          style={{ gridTemplateColumns: "minmax(56px,auto) 1fr 1fr" }}
        >
          <div />
          <AxisLabel label="No replacement" />
          <AxisLabel label="With replacement" />

          <AxisLabel label="Order matters" />
          <MapCell cell="matters_no" chip={chipInCell("matters_no")} checked={checked} />
          <MapCell cell="matters_with" chip={chipInCell("matters_with")} checked={checked} />

          <AxisLabel label="Order ignored" />
          <MapCell cell="ignored_no" chip={chipInCell("ignored_no")} checked={checked} />
          <MapCell cell="ignored_with" chip={chipInCell("ignored_with")} checked={checked} />
        </div>

        {/* Tray of distribution-quality chips */}
        <Tray>
          {trayChips.map((c) => (
            <DraggableChip key={c.id} chip={c} disabled={solved} />
          ))}
          {trayChips.length === 0 && (
            <span className="text-[11px] text-stone-400">
              all placed, check your answer
            </span>
          )}
        </Tray>

        <DragOverlay dropAnimation={null}>
          {activeChip ? <ChipBody chip={activeChip} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {checked && !allCorrect && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Not quite</p>
          <p className="mt-0.5">
            The red cells hold the wrong quality. Numbered balls = order matters;
            one-per-bin = no replacement.
          </p>
        </div>
      )}
      {solved && (
        <div className="mt-4 animate-fade-in rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-bold">Same four worlds, two languages</p>
          <p className="mt-0.5">
            Choosing and distributing are the same map: numbered/identical balls
            set the order axis, and reusable/exclusive bins set the replacement
            axis.
          </p>
        </div>
      )}

      {!solved && (
        <button onClick={check} disabled={!allPlaced} className="btn-primary mt-5 w-full">
          Check answer
        </button>
      )}
    </div>
  );
}

function AxisLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border-2 border-stone-200 bg-white px-2 py-2.5 text-center text-xs font-bold leading-tight text-stone-600">
      {label}
    </div>
  );
}

function MapCell({
  cell,
  chip,
  checked,
}: {
  cell: CellId;
  chip: Chip | null;
  checked: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cell });
  const wrong = checked && chip != null && chip.cell !== cell;
  const correct = checked && chip != null && chip.cell === cell;

  let border = "border-stone-100 bg-stone-50";
  if (wrong) border = "border-red-400 bg-red-50";
  else if (correct) border = "border-emerald-400 bg-emerald-50";
  else if (isOver) border = "border-brand-400 bg-brand-50";

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[92px] flex-col items-center justify-start gap-1.5 rounded-xl border-2 px-1.5 py-2 transition ${border}`}
    >
      <span className="text-[13px] font-bold text-stone-800">{FAMILY[cell]}</span>
      <div className="flex w-full flex-1 items-center justify-center">
        {chip ? (
          <DraggableChip chip={chip} placed />
        ) : (
          <span className="text-[10px] text-stone-300">drop quality</span>
        )}
      </div>
    </div>
  );
}

function Tray({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "tray" });
  return (
    <div
      ref={setNodeRef}
      className={`mt-3 flex min-h-[72px] flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-3 transition ${
        isOver ? "border-brand-300 bg-brand-50" : "border-stone-200 bg-stone-50"
      }`}
    >
      {children}
    </div>
  );
}

function DraggableChip({
  chip,
  placed,
  disabled,
}: {
  chip: Chip;
  placed?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: chip.id,
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
      <ChipBody chip={chip} placed={placed} />
    </div>
  );
}

/** Presentational chip shared by the in-place draggable and the drag overlay. */
function ChipBody({
  chip,
  placed,
  dragging,
}: {
  chip: Chip;
  placed?: boolean;
  dragging?: boolean;
}) {
  return (
    <div
      aria-label={`${chip.ball}, ${chip.bin}`}
      className={`flex flex-col items-center rounded-lg border-2 border-stone-200 bg-white px-2 py-1 text-center ${
        dragging ? "rotate-2 shadow-xl" : "shadow-sm"
      } ${placed ? "w-[104px]" : "w-[120px]"}`}
    >
      <span className="text-[11px] font-extrabold leading-tight text-stone-800">
        {chip.ball}
      </span>
      <span className="text-[10px] font-semibold leading-tight text-stone-500">
        {chip.bin}
      </span>
    </div>
  );
}
