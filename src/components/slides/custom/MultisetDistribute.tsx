import { useRef, useState } from "react";
import type { CustomSlideProps } from "./registry";

/**
 * Lesson 5, slide 2: distributing is choosing. Hand out K=5 identical $1 bills
 * among N=3 friends. Pin one friend at the front, then the row has BLANKS = K +
 * (N-1) = 7 spots. Dropping the other N-1 = 2 friends into the row and letting
 * cash fill the gaps shows: each friend collects the money to their right, so a
 * payout is just a choice of where the friends stand, C(7, 2) of them.
 */

const FRIENDS = [
  { id: "ana", name: "Ana", chip: "bg-rose-500", ring: "ring-rose-300" },
  { id: "ben", name: "Ben", chip: "bg-brand-500", ring: "ring-brand-300" },
  { id: "cam", name: "Cam", chip: "bg-umber-500", ring: "ring-umber-300" },
];
const FIXED = FRIENDS[0];
const MOVABLE = FRIENDS.slice(1); // Ben, Cam

const BLANKS = 7; // K + (N - 1) = 5 + 2
const DOLLARS = 5;

type Cell =
  | { kind: "friend"; friendId: string }
  | { kind: "money" }
  | { kind: "empty" };

function friendOf(id: string) {
  return FRIENDS.find((f) => f.id === id)!;
}

export default function MultisetDistribute({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [slots, setSlots] = useState<(string | null)[]>(
    Array(BLANKS).fill(null),
  );
  const [sel, setSel] = useState<string | null>(null);
  // Completion fires once; the learner can keep rearranging afterward.
  const completed = useRef(false);

  const placedIds = slots.filter(Boolean) as string[];
  const tray = MOVABLE.filter((f) => !placedIds.includes(f.id));
  const bothPlaced = placedIds.length === MOVABLE.length;

  // Once every friend has a spot, the leftover blanks become $1 bills.
  const row: Cell[] = slots.map((s) =>
    s
      ? { kind: "friend", friendId: s }
      : bothPlaced
        ? { kind: "money" }
        : { kind: "empty" },
  );
  const fullRow: Cell[] = [{ kind: "friend", friendId: FIXED.id }, ...row];

  // Each friend keeps the cash to their right, up to the next friend.
  const totals: Record<string, number> = {};
  let current: string | null = null;
  for (const c of fullRow) {
    if (c.kind === "friend") {
      current = c.friendId;
      totals[current] = 0;
    } else if (c.kind === "money" && current) {
      totals[current] += 1;
    }
  }

  function tapTray(id: string) {
    setSel((s) => (s === id ? null : id));
  }

  function tapBlank(i: number) {
    // Tapping a seated friend frees their spot.
    if (slots[i]) {
      const next = [...slots];
      next[i] = null;
      setSlots(next);
      setSel(null);
      return;
    }
    if (!sel) return;
    const next = [...slots];
    next[i] = sel;
    setSel(null);
    setSlots(next);
    if (
      !completed.current &&
      (next.filter(Boolean) as string[]).length === MOVABLE.length
    ) {
      completed.current = true;
      onComplete();
    }
  }

  function reset() {
    setSlots(Array(BLANKS).fill(null));
    setSel(null);
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Distributing is choosing"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Hand out <b>${DOLLARS}</b> in $1 bills to <b>3 friends</b>. <b>Ana</b> is
        pinned at the front; drop <b>Ben</b> and <b>Cam</b> into the line. Each
        friend keeps the cash to their <b>right</b>.
      </p>

      {/* Tray of movable friends */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
          Place
        </span>
        {tray.length === 0 ? (
          <span className="text-[13px] font-semibold text-emerald-600">
            Everyone's in line
          </span>
        ) : (
          tray.map((f) => (
            <button
              key={f.id}
              onClick={() => tapTray(f.id)}
              aria-label={`place ${f.name}`}
              className={`rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-sm transition active:scale-95 ${f.chip} ${
                sel === f.id ? `ring-4 ${f.ring}` : ""
              }`}
            >
              {f.name}
            </button>
          ))
        )}
      </div>

      {/* The line: fixed friend at the front, then 7 blanks */}
      <div className="mt-4 flex items-stretch gap-1 overflow-x-auto rounded-2xl bg-stone-50 p-2 ring-1 ring-stone-100">
        <div className="flex flex-col items-center">
          <FriendCell friendId={FIXED.id} />
          <span className="mt-1 text-[9px] font-bold uppercase tracking-wide text-stone-400">
            front
          </span>
        </div>
        <div className="mx-0.5 w-px shrink-0 self-stretch bg-stone-200" />
        {slots.map((_, i) => {
          const cell = row[i];
          return (
            <div key={i} className="flex flex-col items-center">
              <button
                onClick={() => tapBlank(i)}
                aria-label={`position ${i + 1}`}
                disabled={cell.kind === "money"}
                className="block"
              >
                {cell.kind === "friend" ? (
                  <FriendCell friendId={cell.friendId} />
                ) : cell.kind === "money" ? (
                  <MoneyCell />
                ) : (
                  <EmptyCell active={sel !== null} />
                )}
              </button>
              <span className="mt-1 text-[9px] font-semibold text-stone-300">
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {!bothPlaced && (
        <p className="mt-3 text-center text-[13px] text-stone-500">
          {sel
            ? `Tap a numbered spot to seat ${friendOf(sel).name}.`
            : "Tap a friend above, then tap a spot in the line."}
        </p>
      )}

      {bothPlaced && (
        <div className="mt-4 animate-fade-in-up space-y-3">
          {/* Payout readout */}
          <div className="rounded-2xl bg-stone-900 p-4 text-white">
            <p className="text-center text-[12px] font-semibold text-stone-300">
              Each friend keeps the bills to their right
            </p>
            <div className="mt-2 flex justify-center gap-2">
              {FRIENDS.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-1 flex-col items-center rounded-xl bg-white/10 py-2"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white ${f.chip}`}
                  >
                    {f.name[0]}
                  </span>
                  <span className="mt-1 text-lg font-extrabold text-emerald-300">
                    ${totals[f.id] ?? 0}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[12px] text-stone-400">
              total = ${DOLLARS}
            </p>
          </div>

          {/* The punchline */}
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-bold">A payout is just a choice of spots.</p>
            <p className="mt-0.5">
              You picked <b>2 of 7</b> spots for the friends, and the bills fall into
              place. So splitting ${DOLLARS} among 3 friends ={" "}
              <b>C(7, 2) = 21</b> ways. That's choosing with repeats, coming up
              next as <b>stars and bars</b>.
            </p>
            <button
              onClick={reset}
              className="mt-3 rounded-full bg-stone-200 px-4 py-1.5 text-xs font-bold text-stone-600 transition active:scale-95"
            >
              Try another split
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FriendCell({ friendId }: { friendId: string }) {
  const f = friendOf(friendId);
  return (
    <span
      className={`flex h-12 w-9 items-center justify-center rounded-lg text-xs font-extrabold text-white shadow-sm ${f.chip}`}
    >
      {f.name}
    </span>
  );
}

function MoneyCell() {
  return (
    <span className="flex h-12 w-9 animate-pop-in items-center justify-center rounded-lg bg-emerald-100 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-300">
      $1
    </span>
  );
}

function EmptyCell({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-12 w-9 items-center justify-center rounded-lg border-2 border-dashed text-stone-300 transition ${
        active ? "border-brand-400 bg-brand-50" : "border-stone-300 bg-white"
      }`}
    >
      +
    </span>
  );
}
