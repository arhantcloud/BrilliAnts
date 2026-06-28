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
 * Lesson 6, slide 2: the replacement axis, same balls-into-bins model as
 * slide 1 but order is always ignored (it's a cup of scoops). The toggle now
 * controls whether a bin may hold more than one ball:
 *
 *   REPEATS OK (not exclusive) -> a flavor can take many scoops = MULTISET: C(4,2) = 6.
 *   EXCLUSIVE  (one per bin)   -> each flavor at most once    = COMBINATION: C(3,2) = 3.
 *
 * Forbidding repeats is exactly choosing without replacement. The completion
 * gate asks the learner to match the repeat rule to the bin behavior it needs.
 */

type BinId = "V" | "C" | "S";

const BINS: { id: BinId; name: string; dot: string; soft: string }[] = [
  { id: "V", name: "Vanilla", dot: "bg-amber-200", soft: "border-amber-200 bg-amber-50" },
  { id: "C", name: "Chocolate", dot: "bg-amber-800", soft: "border-amber-300 bg-amber-100" },
  { id: "S", name: "Strawberry", dot: "bg-rose-400", soft: "border-rose-200 bg-rose-50" },
];

const BIN_DOT: Record<BinId, string> = {
  V: "bg-amber-200",
  C: "bg-amber-800",
  S: "bg-rose-400",
};
const BIN_ORDER: Record<BinId, number> = { V: 0, C: 1, S: 2 };

export default function ExclusiveBins({ slide, onComplete }: CustomSlideProps) {
  // ballBin[i] = which flavor bin scoop i sits in, or null while in the tray.
  const [ballBin, setBallBin] = useState<(BinId | null)[]>([null, null]);
  const [exclusive, setExclusive] = useState(false);
  const [seenExclusive, setSeenExclusive] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const allPlaced = ballBin.every((b) => b != null);
  const counts = BINS.map((bin) => ballBin.filter((b) => b === bin.id).length);
  const repeatUsed = counts.some((c) => c > 1);
  const scoops = ballBin
    .filter((b): b is BinId => b != null)
    .sort((a, b) => BIN_ORDER[a] - BIN_ORDER[b]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(String(event.active.id).replace("scoop-", "")));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (solved) return;
    const { active, over } = event;
    if (!over) return;
    const i = Number(String(active.id).replace("scoop-", ""));
    const target = String(over.id);
    setBallBin((prev) => {
      // Exclusive bins hold at most one scoop, so bounce a drop into a full bin.
      if (target !== "tray" && exclusive) {
        const occupied = prev.some((b, idx) => idx !== i && b === target);
        if (occupied) {
          setBlocked(true);
          window.setTimeout(() => setBlocked(false), 1200);
          return prev;
        }
      }
      return prev.map((b, idx) =>
        idx === i ? (target === "tray" ? null : (target as BinId)) : b,
      );
    });
  }

  function setMode(toExclusive: boolean) {
    if (solved) return;
    setExclusive(toExclusive);
    if (toExclusive) {
      setSeenExclusive(true);
      // Drop any double-scoops back to the tray so the bins stay valid.
      setBallBin((prev) => {
        const seen = new Set<BinId>();
        return prev.map((b) => {
          if (b == null) return null;
          if (seen.has(b)) return null;
          seen.add(b);
          return b;
        });
      });
    }
  }

  function handleSolved() {
    if (solved) return;
    setSolved(true);
    onComplete();
  }

  const trayScoops = ballBin
    .map((b, i) => ({ b, i }))
    .filter((x) => x.b == null)
    .map((x) => x.i);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Repeats or exclusive?"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Drop <b>2 scoops</b> into the flavor bins. Order doesn’t matter, it’s one
        cup. With <b>repeats</b> a flavor can take both scoops; go{" "}
        <b>exclusive</b> and each flavor holds at most one.
      </p>

      {/* Repeats / Exclusive toggle */}
      <div className="mt-5 flex justify-center">
        <div
          role="group"
          aria-label="Bin rule"
          className="inline-flex rounded-xl bg-stone-100 p-1"
        >
          {[
            { label: "Repeats OK", val: false, aria: "Allow repeats" },
            { label: "Exclusive", val: true, aria: "Make bins exclusive" },
          ].map((opt) => {
            const selected = exclusive === opt.val;
            return (
              <button
                key={opt.label}
                type="button"
                aria-label={opt.aria}
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
            exclusive
              ? "bg-umber-100 text-umber-700"
              : "bg-brand-100 text-brand-700"
          }`}
        >
          {exclusive ? "Combination · no repeats" : "Multiset · repeats ok"}
        </span>
        <span className="text-[13px] font-semibold text-stone-600">
          {exclusive ? "3 possible" : "6 possible"}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Tray of scoops still waiting to be placed */}
        <Tray>
          {trayScoops.map((i) => (
            <DraggableScoop key={i} index={i} color="bg-stone-300" disabled={solved} />
          ))}
          {trayScoops.length === 0 && (
            <span className="text-[11px] text-stone-400">
              both scoops placed, drag them between bins to rearrange
            </span>
          )}
        </Tray>

        {/* The three flavor bins */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {BINS.map((bin) => {
            const here = ballBin
              .map((b, i) => ({ b, i }))
              .filter((x) => x.b === bin.id)
              .map((x) => x.i);
            const full = exclusive && here.length >= 1;
            return (
              <DroppableBin
                key={bin.id}
                bin={bin}
                empty={here.length === 0}
                locked={full}
              >
                {here.map((i) => (
                  <DraggableScoop
                    key={i}
                    index={i}
                    color={bin.dot}
                    disabled={solved}
                  />
                ))}
              </DroppableBin>
            );
          })}
        </div>
        {blocked && (
          <p className="mt-2 text-center text-[12px] font-semibold text-red-500">
            That flavor already has a scoop. Exclusive means one per bin.
          </p>
        )}

        <DragOverlay dropAnimation={null}>
          {activeId != null ? (
            <ScoopBody
              color={ballBin[activeId] ? BIN_DOT[ballBin[activeId]!] : "bg-stone-300"}
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Read the distribution as a cup of scoops */}
      <div className="mt-4 rounded-2xl bg-stone-900 p-5 text-white">
        {!allPlaced ? (
          <p className="text-center text-[13px] text-stone-300">
            Drop both scoops into the bins to build your cup.
          </p>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex h-24 w-20 flex-col-reverse items-center justify-start gap-1 rounded-b-3xl rounded-t-md bg-white/5 p-2 ring-2 ring-white/15">
              {scoops.map((f, i) => (
                <span
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-black/60 ring-2 ring-black/10 ${BIN_DOT[f]}`}
                >
                  {f}
                </span>
              ))}
            </div>
            <p className="mt-3 text-center text-[13px] text-stone-200">
              {exclusive ? (
                "One scoop per flavor, that's a combination."
              ) : repeatUsed ? (
                <>
                  a <b>double scoop</b>, only possible when repeats are allowed
                </>
              ) : (
                "two different flavors, allowed either way"
              )}
            </p>
          </div>
        )}
      </div>

      {/* Gate: match the repeat rule to the bin behavior it needs */}
      {seenExclusive && (
        <div className="mt-5 animate-fade-in-up rounded-2xl border-2 border-stone-100 bg-white p-4">
          <p className="mb-3 text-center text-[13px] font-semibold text-stone-600">
            Connect each rule to how the bins behave. Flip the toggle above if you
            need a hint.
          </p>
          <MatchPairs
            disabled={solved}
            onSolved={handleSolved}
            left={[
              { id: "repeat", title: "Repeats allowed" },
              { id: "excl", title: "No repeats" },
            ]}
            right={[
              {
                id: "excl",
                title: "Exclusive",
                sub: "one per bin → combination",
              },
              {
                id: "repeat",
                title: "Not exclusive",
                sub: "a bin reused → multiset",
              },
            ]}
          />
        </div>
      )}

      {solved && (
        <div className="mt-4 animate-fade-in-up rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold">No repeats ⇄ exclusive</p>
          <p className="mt-0.5">
            <b>Exclusive</b> bins (one scoop each) forbid repeats, so that’s a{" "}
            <b>combination</b>, 3 cups. Allow repeats (not exclusive) and the
            double scoops VV, CC, SS join in, growing it to <b>6</b>, a{" "}
            <b>multiset</b>. Whether a bin can be reused is the <b>replacement</b>{" "}
            axis of choosing.
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
  locked,
  children,
}: {
  bin: { id: BinId; name: string; dot: string; soft: string };
  empty: boolean;
  locked: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bin.id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-2 transition ${
        isOver ? "border-brand-400 bg-brand-50" : bin.soft
      }`}
    >
      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-600">
        <span className={`h-2.5 w-2.5 rounded-full ${bin.dot} ring-1 ring-black/10`} />
        {bin.name}
      </div>
      <div className="mt-1.5 flex min-h-[2.75rem] flex-wrap items-center justify-center gap-1.5">
        {empty && (
          <span className="text-[10px] text-stone-300">
            {locked ? "" : "drop"}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function DraggableScoop({
  index,
  color,
  disabled,
}: {
  index: number;
  color: string;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `scoop-${index}`,
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
      <ScoopBody color={color} />
    </div>
  );
}

/** Presentational scoop shared by the in-place draggable and the drag overlay. */
function ScoopBody({ color, dragging }: { color: string; dragging?: boolean }) {
  return (
    <span
      className={`block h-10 w-10 rounded-full ring-2 ring-black/10 transition ${color} ${
        dragging ? "rotate-3 shadow-xl" : "shadow-sm"
      }`}
    />
  );
}
