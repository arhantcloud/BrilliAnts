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

// Scenario numbers: elect 3 distinct officers from 7 members → P(7,3).
const N = 7;
const K = 3;
const RESULT = 210; // 7! / 4! = 5040 / 24

type Token = { id: string; value: string };

// Build the GENERAL formula with variables; no digit tiles so it can't be
// assembled with numbers. Bank is padded with non-numeric distractors.
const TOKENS: Token[] = [
  { id: "n1", value: "n" },
  { id: "n2", value: "n" },
  { id: "k1", value: "k" },
  { id: "ex1", value: "!" },
  { id: "ex2", value: "!" },
  // distractors / useless tiles (variables & symbols only)
  { id: "n3", value: "n" },
  { id: "k2", value: "k" },
  { id: "m1", value: "m" },
  { id: "mul", value: "×" },
  { id: "add", value: "+" },
  { id: "sq", value: "²" },
];

type Slot = { id: string; expect: string };

const NUM_SLOTS: Slot[] = [
  { id: "numA", expect: "n" },
  { id: "numB", expect: "!" },
];
const DEN_SLOTS: Slot[] = [
  { id: "denA", expect: "n" },
  { id: "denB", expect: "k" },
  { id: "denC", expect: "!" },
];
const ALL_SLOTS = [...NUM_SLOTS, ...DEN_SLOTS];

type Assignments = Record<string, string | null>;

export default function PermutationFormula({
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

  // Click a bank token → drop into the first empty slot (tap fallback).
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

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "The permutation formula"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        A club of <b>{N}</b> members elects a <b>President</b>, <b>VP</b>, and{" "}
        <b>Treasurer</b> — three different roles, no one holds two. Picking{" "}
        <b>{K}</b> of <b>{N}</b> in order is a <b>permutation</b>, written{" "}
        <b>P(n, k)</b>. Here <b>n = {N}</b> and <b>k = {K}</b> — build its
        formula.
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
            P(n, k) =
          </span>
          <div className="flex flex-col items-center">
            <div className="flex items-end gap-1 pb-1.5">
              {NUM_SLOTS.map((s) => (
                <SlotBox
                  key={s.id}
                  slot={s}
                  token={tokenValue(assign[s.id])}
                  correct={allFilled ? slotCorrect(s) : null}
                  solved={solved}
                  onClear={() => clearSlot(s.id)}
                />
              ))}
            </div>
            <div className="h-1 w-full min-w-[170px] rounded bg-slate-800" />
            <div className="flex items-end gap-1 pt-1.5">
              <span className="pb-1 text-2xl font-extrabold text-slate-700">(</span>
              <SlotBox
                slot={DEN_SLOTS[0]}
                token={tokenValue(assign[DEN_SLOTS[0].id])}
                correct={allFilled ? slotCorrect(DEN_SLOTS[0]) : null}
                solved={solved}
                onClear={() => clearSlot(DEN_SLOTS[0].id)}
              />
              <span className="pb-1 text-2xl font-extrabold text-slate-700">−</span>
              <SlotBox
                slot={DEN_SLOTS[1]}
                token={tokenValue(assign[DEN_SLOTS[1].id])}
                correct={allFilled ? slotCorrect(DEN_SLOTS[1]) : null}
                solved={solved}
                onClear={() => clearSlot(DEN_SLOTS[1].id)}
              />
              <span className="pb-1 text-2xl font-extrabold text-slate-700">)</span>
              <SlotBox
                slot={DEN_SLOTS[2]}
                token={tokenValue(assign[DEN_SLOTS[2].id])}
                correct={allFilled ? slotCorrect(DEN_SLOTS[2]) : null}
                solved={solved}
                onClear={() => clearSlot(DEN_SLOTS[2].id)}
              />
            </div>
          </div>
        </div>

        {/* Bank */}
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

      {/* Feedback */}
      {solved ? (
        <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
          <p className="animate-fade-in text-xl font-extrabold tracking-wide">
            P({N}, {K}) ={" "}
            <span className="text-brand-300">
              {N}! / {N - K}!
            </span>{" "}
            = {RESULT}
          </p>
          <p className="mt-2 text-[13px] text-slate-300">
            {RESULT} ways to fill the {K} officer roles from {N} members.
          </p>
        </div>
      ) : allFilled ? (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Not quite</p>
          <p className="mt-0.5">
            The total is <b>n!</b>; divide by the leftover <b>(n − k)!</b>{" "}
            orderings. Tap a tile in the formula to send it back.
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
      className={`flex h-12 w-11 items-center justify-center rounded-xl border-2 text-2xl font-extrabold transition ${cls} ${
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
      className={`flex h-12 w-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-2xl font-extrabold text-slate-800 ${
        dragging ? "rotate-3 shadow-xl" : "shadow-sm"
      }`}
    >
      {value}
    </div>
  );
}
