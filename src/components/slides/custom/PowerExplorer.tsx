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

// Variables & symbols only, no digits, so it can't be built with numbers.
const TOKENS: Token[] = [
  { id: "n1", value: "n" },
  { id: "k1", value: "k" },
  { id: "n2", value: "n" },
  { id: "k2", value: "k" },
  { id: "m", value: "m" },
  { id: "mul", value: "×" },
  { id: "sq", value: "²" },
  { id: "add", value: "+" },
];

type Slot = { id: string; expect: string };
const SLOTS: Slot[] = [
  { id: "base", expect: "n" },
  { id: "exp", expect: "k" },
];

type Assignments = Record<string, string | null>;

export default function PowerExplorer({ slide, onComplete }: CustomSlideProps) {
  const [assign, setAssign] = useState<Assignments>({ base: null, exp: null });
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

  const allFilled = SLOTS.every((s) => assign[s.id]);
  const slotCorrect = (s: Slot) => tokenValue(assign[s.id]) === s.expect;

  function commit(next: Assignments) {
    setAssign(next);
    if (!solved && SLOTS.every((s) => tokenValue(next[s.id]) === s.expect)) {
      setSolved(true);
      onComplete();
    }
  }

  function placeInSlot(tokenId: string, slotId: string) {
    if (solved) return;
    const next: Assignments = { ...assign };
    for (const s of SLOTS) if (next[s.id] === tokenId) next[s.id] = null;
    next[slotId] = tokenId;
    commit(next);
  }

  function clearSlot(slotId: string) {
    if (solved || !assign[slotId]) return;
    commit({ ...assign, [slotId]: null });
  }

  function tapToken(tokenId: string) {
    if (solved) return;
    const empty = SLOTS.find((s) => !assign[s.id]);
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
      for (const s of SLOTS) if (next[s.id] === tokenId) next[s.id] = null;
      commit(next);
    } else {
      placeInSlot(tokenId, target);
    }
  }

  const activeToken = TOKENS.find((t) => t.id === activeId);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "n to the k"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        You make <b>k</b> independent choices, and every choice has the same{" "}
        <b>n</b> options (reuse allowed). How many outcomes are possible? Drag
        tiles to build the formula.
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Formula: base ^ exponent */}
        <div className="mt-6 flex items-start justify-center gap-3">
          <span className="mt-4 text-2xl font-extrabold text-stone-800">
            outcomes =
          </span>
          <div className="flex items-start">
            <SlotBox
              slot={SLOTS[0]}
              token={tokenValue(assign.base)}
              correct={allFilled ? slotCorrect(SLOTS[0]) : null}
              solved={solved}
              big
              onClear={() => clearSlot("base")}
            />
            <div className="-ml-1 -mt-2">
              <SlotBox
                slot={SLOTS[1]}
                token={tokenValue(assign.exp)}
                correct={allFilled ? slotCorrect(SLOTS[1]) : null}
                solved={solved}
                onClear={() => clearSlot("exp")}
              />
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
            <span className="py-2 text-xs text-stone-400">Bank empty</span>
          )}
        </Bank>

        <DragOverlay dropAnimation={null}>
          {activeToken ? <TokenBody value={activeToken.value} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {solved ? (
        <div className="mt-5 rounded-2xl bg-stone-900 p-5 text-center text-white">
          <p className="animate-fade-in text-xl font-extrabold tracking-wide">
            nᵏ ={" "}
            <span className="text-brand-300">n × n × ⋯ × n</span>
          </p>
          <p className="mt-2 text-[13px] text-stone-300">
            Each of the k positions multiplies in another n choices, for example
            4 symbols in 3 slots gives 4³ = 64.
          </p>
        </div>
      ) : allFilled ? (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Not quite</p>
          <p className="mt-0.5">
            The base is what repeats (the <b>n</b> options); the exponent counts
            how many times you choose (the <b>k</b> positions). Tap a tile to
            send it back.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-stone-400">
          Drag tiles into the base and the exponent, or tap a tile to drop it in
          the next blank.
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
        isOver ? "border-brand-300 bg-brand-50" : "border-stone-200 bg-stone-50"
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
  big,
  onClear,
}: {
  slot: Slot;
  token: string | null;
  correct: boolean | null;
  solved: boolean;
  big?: boolean;
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });

  let cls = "border-dashed border-stone-300 bg-white";
  if (correct === true) cls = "border-emerald-400 bg-emerald-50";
  else if (correct === false) cls = "border-red-400 bg-red-50";
  else if (token) cls = "border-brand-400 bg-brand-50";
  else if (isOver) cls = "border-brand-400 bg-brand-50";

  const size = big ? "h-16 w-14 text-4xl" : "h-11 w-10 text-2xl";

  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-label={`formula slot ${slot.id}`}
      disabled={solved || !token}
      onClick={onClear}
      className={`flex items-center justify-center rounded-xl border-2 font-extrabold transition ${size} ${cls} ${
        token && !solved ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <span className={token ? "text-stone-800" : "text-stone-300"}>
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
      className={`flex h-12 w-11 items-center justify-center rounded-xl border-2 border-stone-200 bg-white text-2xl font-extrabold text-stone-800 ${
        dragging ? "rotate-3 shadow-xl" : "shadow-sm"
      }`}
    >
      {value}
    </div>
  );
}
