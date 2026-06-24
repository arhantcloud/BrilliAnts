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

type Token = { id: string; value: string };

// Variables & symbols only — no digits.
const TOKENS: Token[] = [
  { id: "n1", value: "n" },
  { id: "n2", value: "n" },
  { id: "k1", value: "k" },
  { id: "k2", value: "k" },
  { id: "ex1", value: "!" },
  { id: "ex2", value: "!" },
  { id: "ex3", value: "!" },
  { id: "m", value: "m" },
  { id: "mul", value: "×" },
  { id: "sq", value: "²" },
  { id: "add", value: "+" },
];

type Slot = { id: string; expect: string };
const NUM_SLOTS: Slot[] = [
  { id: "numA", expect: "n" },
  { id: "numB", expect: "!" },
];
// denominator: k! ( n − k )!
const DEN_SLOTS: Slot[] = [
  { id: "denA", expect: "k" },
  { id: "denB", expect: "!" },
  { id: "denC", expect: "n" },
  { id: "denD", expect: "k" },
  { id: "denE", expect: "!" },
];
const ALL_SLOTS = [...NUM_SLOTS, ...DEN_SLOTS];

type Assignments = Record<string, string | null>;

export default function CombinationFormula({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [assign, setAssign] = useState<Assignments>(() =>
    Object.fromEntries(ALL_SLOTS.map((s) => [s.id, null])),
  );
  const [solved, setSolved] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const tokenValue = (id: string | null) =>
    TOKENS.find((t) => t.id === id)?.value ?? null;

  const usedIds = Object.values(assign).filter(Boolean) as string[];
  const bankTokens = TOKENS.filter((t) => !usedIds.includes(t.id));

  const allFilled = ALL_SLOTS.every((s) => assign[s.id]);
  const slotCorrect = (s: Slot) => tokenValue(assign[s.id]) === s.expect;

  function commit(next: Assignments) {
    setAssign(next);
    if (!solved && ALL_SLOTS.every((s) => tokenValue(next[s.id]) === s.expect)) {
      setSolved(true);
      onComplete();
    }
  }

  function placeInSlot(tokenId: string, slotId: string) {
    if (solved) return;
    const next: Assignments = { ...assign };
    for (const s of ALL_SLOTS) if (next[s.id] === tokenId) next[s.id] = null;
    next[slotId] = tokenId;
    commit(next);
  }

  function clearSlot(slotId: string) {
    if (solved || !assign[slotId]) return;
    commit({ ...assign, [slotId]: null });
  }

  function tapToken(tokenId: string) {
    if (solved) return;
    const empty = ALL_SLOTS.find((s) => !assign[s.id]);
    if (empty) placeInSlot(tokenId, empty.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (solved) return;
    const { active, over } = event;
    if (!over) return;
    const tokenId = String(active.id);
    const target = String(over.id);
    if (target === "bank") {
      const next: Assignments = { ...assign };
      for (const s of ALL_SLOTS) if (next[s.id] === tokenId) next[s.id] = null;
      commit(next);
    } else {
      placeInSlot(tokenId, target);
    }
  }

  const activeToken = TOKENS.find((t) => t.id === activeId);
  const box = (id: string) => (
    <SlotBox
      slot={ALL_SLOTS.find((s) => s.id === id)!}
      token={tokenValue(assign[id])}
      correct={allFilled ? slotCorrect(ALL_SLOTS.find((s) => s.id === id)!) : null}
      solved={solved}
      onClear={() => clearSlot(id)}
    />
  );

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Divide out the orderings"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        A combination takes the ordered picks and divides out every way each
        chosen group could be arranged. Build the formula for <b>C(n, k)</b>.
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Formula */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="text-2xl font-extrabold text-slate-800">
            C(n, k) =
          </span>
          <div className="flex flex-col items-center">
            <div className="flex items-end gap-1 pb-1.5">
              {box("numA")}
              {box("numB")}
            </div>
            <div className="h-1 w-full min-w-[210px] rounded bg-slate-800" />
            <div className="flex flex-wrap items-end justify-center gap-1 pt-1.5">
              {box("denA")}
              {box("denB")}
              <span className="px-0.5 pb-1 text-2xl font-extrabold text-slate-700">
                (
              </span>
              {box("denC")}
              <span className="pb-1 text-2xl font-extrabold text-slate-700">
                −
              </span>
              {box("denD")}
              <span className="px-0.5 pb-1 text-2xl font-extrabold text-slate-700">
                )
              </span>
              {box("denE")}
            </div>
          </div>
        </div>

        <Bank>
          {bankTokens.map((t) => (
            <DraggableToken
              key={t.id}
              token={t}
              disabled={solved}
              onTap={() => tapToken(t.id)}
            />
          ))}
          {bankTokens.length === 0 && (
            <span className="py-2 text-xs text-slate-400">Bank empty</span>
          )}
        </Bank>

        <DragOverlay dropAnimation={null}>
          {activeToken ? <TokenBody value={activeToken.value} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {solved ? (
        <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
          <p className="animate-fade-in text-xl font-extrabold tracking-wide">
            C(5, 3) ={" "}
            <span className="text-emerald-300">5! / (3! · 2!)</span> = 10
          </p>
          <p className="mt-2 text-[13px] text-slate-300">
            The k! divides out each group's orderings; the (n−k)! divides out the
            ones you didn't pick.
          </p>
        </div>
      ) : allFilled ? (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Not quite</p>
          <p className="mt-0.5">
            Top is the full <b>n!</b>. The bottom divides by <b>k!</b> (orderings
            of your group) <i>and</i> <b>(n−k)!</b> (the rest). Tap a tile to send
            it back.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-slate-400">
          Drag tiles into the blanks — or tap a tile to drop it in the next blank.
        </p>
      )}
    </div>
  );
}

function Bank({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "bank" });
  return (
    <div
      ref={setNodeRef}
      className={`mt-6 flex min-h-[64px] flex-wrap items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-3 transition ${
        isOver ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      {children}
    </div>
  );
}

function SlotBox({
  slot,
  token,
  correct,
  solved,
  onClear,
}: {
  slot: Slot;
  token: string | null;
  correct: boolean | null;
  solved: boolean;
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });

  let cls = "border-dashed border-slate-300 bg-white";
  if (correct === true) cls = "border-emerald-400 bg-emerald-50";
  else if (correct === false) cls = "border-red-400 bg-red-50";
  else if (token) cls = "border-brand-400 bg-brand-50";
  else if (isOver) cls = "border-brand-400 bg-brand-50";

  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-label={`formula slot ${slot.id}`}
      disabled={solved || !token}
      onClick={onClear}
      className={`flex h-12 w-10 items-center justify-center rounded-xl border-2 text-2xl font-extrabold transition ${cls} ${
        token && !solved ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <span className={token ? "text-slate-800" : "text-slate-300"}>
        {token ?? "?"}
      </span>
    </button>
  );
}

function DraggableToken({
  token,
  disabled,
  onTap,
}: {
  token: Token;
  disabled?: boolean;
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: token.id,
    disabled,
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      aria-label={`tile ${token.value}`}
      onClick={onTap}
      className={`touch-none select-none ${
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-30" : "opacity-100"}`}
    >
      <TokenBody value={token.value} />
    </button>
  );
}

function TokenBody({ value, dragging }: { value: string; dragging?: boolean }) {
  return (
    <div
      className={`flex h-12 w-10 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-2xl font-extrabold text-slate-800 ${
        dragging ? "rotate-3 shadow-xl" : "shadow-sm"
      }`}
    >
      {value}
    </div>
  );
}
