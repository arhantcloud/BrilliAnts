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
import MatchPairs from "./MatchPairs";

/**
 * Lesson 6, slide 1: one distribution, two readings. The learner drags 3 balls
 * into two bins, P (pepperoni) and M (mushroom).
 *
 *   NUMBERED balls -> read ball 1,2,3 in order = a PASSWORD (order matters): 2^3 = 8.
 *   IDENTICAL balls -> only the count per bin survives = a PIZZA (order ignored): 4.
 *
 * The same distribution is a password when the balls are numbered and a pizza
 * combo when they are not. The completion gate asks the learner to match the
 * ordering property to the kind of balls it needs. The toggle above is the hint.
 */

type BinId = "P" | "M";

const BINS: { id: BinId; name: string; dot: string; soft: string }[] = [
  { id: "P", name: "Pepperoni", dot: "bg-red-500", soft: "border-red-200 bg-red-50" },
  { id: "M", name: "Mushroom", dot: "bg-amber-700", soft: "border-amber-200 bg-amber-50" },
];

const BIN_DOT: Record<BinId, string> = { P: "bg-red-500", M: "bg-amber-700" };

const PICKS = 3;

/** Fixed spots so the pizza looks the same no matter the drop order. */
const PIZZA_POS = [
  { top: "16%", left: "38%" },
  { top: "52%", left: "18%" },
  { top: "52%", left: "60%" },
];

function factorial(n: number): number {
  let acc = 1;
  for (let i = 2; i <= n; i++) acc *= i;
  return acc;
}

export default function DistributeBins({ slide, onComplete }: CustomSlideProps) {
  // ballBin[i] = which bin ball i sits in, or null while it's still in the tray.
  const [ballBin, setBallBin] = useState<(BinId | null)[]>([null, null, null]);
  const [identical, setIdentical] = useState(false);
  const [seenIdentical, setSeenIdentical] = useState(false);
  const [solved, setSolved] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const allPlaced = ballBin.every((b) => b != null);
  const counts = BINS.map((bin) => ballBin.filter((b) => b === bin.id).length);
  const password = ballBin.map((b) => b ?? "·").join("");
  const sortedToppings = ballBin
    .filter((b): b is BinId => b != null)
    .sort((a, b) => (a === "P" ? -1 : 1) - (b === "P" ? -1 : 1));
  const orderingsForThisPizza =
    factorial(PICKS) / counts.reduce((acc, c) => acc * factorial(c), 1);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(String(event.active.id).replace("ball-", "")));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (solved) return;
    const { active, over } = event;
    if (!over) return;
    const i = Number(String(active.id).replace("ball-", ""));
    const target = String(over.id);
    setBallBin((prev) =>
      prev.map((b, idx) =>
        idx === i ? (target === "tray" ? null : (target as BinId)) : b,
      ),
    );
  }

  function setMode(toIdentical: boolean) {
    if (solved) return;
    setIdentical(toIdentical);
    if (toIdentical) setSeenIdentical(true);
  }

  function handleSolved() {
    if (solved) return;
    setSolved(true);
    onComplete();
  }

  const trayBalls = ballBin
    .map((b, i) => ({ b, i }))
    .filter((x) => x.b == null)
    .map((x) => x.i);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Password or pizza?"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Drag the <b>3 balls</b> into bins <b>P</b> and <b>M</b>.{" "}
        <b>Numbered</b> balls spell a <b>password</b>; make them <b>identical</b>{" "}
        and only the counts remain, a <b>pizza</b>.
      </p>

      {/* Numbered / Identical toggle */}
      <div className="mt-5 flex justify-center">
        <div
          role="group"
          aria-label="Ball type"
          className="inline-flex rounded-xl bg-stone-100 p-1"
        >
          {[
            { label: "Numbered", val: false },
            { label: "Identical", val: true },
          ].map((opt) => {
            const selected = identical === opt.val;
            return (
              <button
                key={opt.label}
                type="button"
                aria-label={`Make balls ${opt.label.toLowerCase()}`}
                aria-pressed={selected}
                disabled={solved}
                onClick={() => setMode(opt.val)}
                className={`min-w-[6rem] rounded-lg px-4 py-2 text-sm font-bold transition active:scale-95 disabled:active:scale-100 ${
                  selected
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Concept + how many are possible */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
            identical
              ? "bg-umber-100 text-umber-700"
              : "bg-brand-100 text-brand-700"
          }`}
        >
          {identical ? "Pizza · order ignored" : "Password · order matters"}
        </span>
        <span className="text-[13px] font-semibold text-stone-600">
          {identical ? (
            "4 possible"
          ) : (
            <>
              2<sup>3</sup> = 8 possible
            </>
          )}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Tray of balls still waiting to be placed */}
        <Tray>
          {trayBalls.map((i) => (
            <DraggableBall key={i} index={i} identical={identical} disabled={solved} />
          ))}
          {trayBalls.length === 0 && (
            <span className="text-[11px] text-stone-400">
              all balls placed, drag them between bins to rearrange
            </span>
          )}
        </Tray>

        {/* The two bins */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {BINS.map((bin) => {
            const here = ballBin
              .map((b, i) => ({ b, i }))
              .filter((x) => x.b === bin.id)
              .map((x) => x.i);
            return (
              <DroppableBin key={bin.id} bin={bin} empty={here.length === 0}>
                {here.map((i) => (
                  <DraggableBall
                    key={i}
                    index={i}
                    identical={identical}
                    disabled={solved}
                  />
                ))}
              </DroppableBin>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeId != null ? (
            <BallBody index={activeId} identical={identical} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Read the distribution as a password or a pizza */}
      <div className="mt-4 rounded-2xl bg-stone-900 p-5 text-white">
        {!allPlaced ? (
          <p className="text-center text-[13px] text-stone-300">
            Drag all 3 balls into the bins to read your{" "}
            {identical ? "pizza" : "password"}.
          </p>
        ) : identical ? (
          <div className="flex flex-col items-center">
            <div className="relative h-28 w-28 rounded-full bg-amber-200 ring-4 ring-amber-300">
              {sortedToppings.map((t, i) => (
                <span
                  key={i}
                  style={PIZZA_POS[i]}
                  className={`absolute flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-black/10 ${BIN_DOT[t]}`}
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-3 text-center text-[13px] text-stone-200">
              {counts[0]} pepperoni, {counts[1]} mushroom:{" "}
              <b>{orderingsForThisPizza}</b> password
              {orderingsForThisPizza === 1 ? "" : "s"} make this same pizza
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
              Read balls 1 → 3 in order
            </p>
            <div className="mt-2 flex items-center gap-2">
              {ballBin.map((b, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[9px] text-stone-400">ball {i + 1}</span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                      b ? BIN_DOT[b] : "bg-stone-600"
                    }`}
                  >
                    {b}
                  </span>
                </div>
              ))}
              <span className="mx-1 text-xl font-bold text-stone-500">=</span>
              <span className="text-2xl font-extrabold tracking-widest">
                {password}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Gate: match the ordering property to the kind of balls it needs */}
      {seenIdentical && (
        <div className="mt-5 animate-fade-in-up rounded-2xl border-2 border-stone-100 bg-white p-4">
          <p className="mb-3 text-center text-[13px] font-semibold text-stone-600">
            Connect each rule to the balls it needs. Flip the toggle above if you
            need a hint.
          </p>
          <MatchPairs
            disabled={solved}
            onSolved={handleSolved}
            left={[
              { id: "matters", title: "Order matters" },
              { id: "ignored", title: "Order doesn’t matter" },
            ]}
            right={[
              {
                id: "ignored",
                title: "Indistinguishable",
                sub: "identical balls → pizza",
              },
              {
                id: "matters",
                title: "Distinguishable",
                sub: "numbered balls → password",
              },
            ]}
          />
        </div>
      )}

      {solved && (
        <div className="mt-4 animate-fade-in-up rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold">Order matters ⇄ distinguishable</p>
          <p className="mt-0.5">
            <b>Numbered</b> (distinguishable) balls make order matter, so that’s a
            password, 2³ = 8. <b>Identical</b> (indistinguishable) balls ignore
            order, so that’s a pizza, just 4. Choosing how many land in each bin,
            order ignored, is exactly a <b>multiset</b>.
          </p>
        </div>
      )}
    </div>
  );
}

function Tray({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "tray" });
  return (
    <div
      ref={setNodeRef}
      className={`mt-4 flex min-h-[64px] flex-wrap items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-3 transition ${
        isOver ? "border-brand-300 bg-brand-50" : "border-stone-200 bg-stone-50"
      }`}
    >
      {children}
    </div>
  );
}

function DroppableBin({
  bin,
  empty,
  children,
}: {
  bin: { id: BinId; name: string; dot: string; soft: string };
  empty: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bin.id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-3 transition ${
        isOver ? "border-brand-400 bg-brand-50" : bin.soft
      }`}
    >
      <div className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-stone-600">
        <span className={`h-3 w-3 rounded-full ${bin.dot}`} />
        Bin {bin.id} · {bin.name}
      </div>
      <div className="mt-2 flex min-h-[3rem] flex-wrap items-center justify-center gap-1.5">
        {empty && <span className="text-[11px] text-stone-300">drop here</span>}
        {children}
      </div>
    </div>
  );
}

function DraggableBall({
  index,
  identical,
  disabled,
}: {
  index: number;
  identical: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ball-${index}`,
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
      <BallBody index={index} identical={identical} />
    </div>
  );
}

/** Presentational ball shared by the in-place draggable and the drag overlay. */
function BallBody({
  index,
  identical,
  dragging,
}: {
  index: number;
  identical: boolean;
  dragging?: boolean;
}) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold text-white ring-1 ring-black/10 transition ${
        identical ? "bg-stone-300" : "bg-brand-500"
      } ${dragging ? "rotate-3 shadow-xl" : "shadow-sm"}`}
    >
      {identical ? "" : index + 1}
    </span>
  );
}
