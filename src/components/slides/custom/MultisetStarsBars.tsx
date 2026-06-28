import { useState } from "react";
import type { CustomSlideProps } from "./registry";

/**
 * Lesson 5, slide 3: the vertical twin of slide 2. A tower has LOCATIONS = 6
 * stacked spots; choosing BARS = 2 of them to be wafer dividers splits the tower
 * into 3 flavors, and scoops fill the remaining 4 spots (a flavor = the scoops
 * sitting just above its bar; the last flavor sits above the top bar). Picking
 * where the 2 bars go *is* the choice of how many scoops of each flavor.
 */

const LOCATIONS = 6;
const BARS = 2;
const SCOOPS = LOCATIONS - BARS; // 4
const FLAVOR_COUNT = BARS + 1; // 3
const TOTAL = LOCATIONS; // wafers + scoops

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

const FLAVORS = [
  { name: "Strawberry", scoop: "bg-rose-300", dot: "bg-rose-400" },
  { name: "Vanilla", scoop: "bg-amber-200", dot: "bg-amber-300" },
  { name: "Mint", scoop: "bg-emerald-300", dot: "bg-emerald-400" },
];

export default function MultisetStarsBars({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [bars, setBars] = useState<boolean[]>(Array(LOCATIONS).fill(false));
  const [scoopsInput, setScoopsInput] = useState("");
  const [barsInput, setBarsInput] = useState("");
  const [totalInput, setTotalInput] = useState("");
  const [wafersInput, setWafersInput] = useState("");
  const [solved, setSolved] = useState(false);

  const barCount = bars.filter(Boolean).length;
  const placedAll = barCount === BARS;

  const scoopsCorrect =
    scoopsInput.trim() !== "" && Number(scoopsInput) === SCOOPS;
  const barsCorrect = barsInput.trim() !== "" && Number(barsInput) === BARS;
  // Step 1 done = bars placed and the split read off correctly.
  const splitDone = placedAll && scoopsCorrect && barsCorrect;

  // Step 2: plug the split into the combination formula C(total, wafers).
  const totalCorrect = totalInput.trim() !== "" && Number(totalInput) === TOTAL;
  const wafersCorrect = wafersInput.trim() !== "" && Number(wafersInput) === BARS;
  const tN = totalInput.trim() === "" ? null : Number(totalInput);
  const wN = wafersInput.trim() === "" ? null : Number(wafersInput);
  // The calculation auto-fills from whatever the learner typed.
  const result = tN !== null && wN !== null && wN <= tN ? choose(tN, wN) : null;

  // Flavor of a non-bar location = how many bars sit below it.
  const flavorIndex = (i: number) =>
    Math.min(bars.slice(0, i).filter(Boolean).length, FLAVORS.length - 1);

  // How many scoops each flavor collects (the scoops sitting above its wafer),
  // mirroring how each friend kept the cash to their right on the last slide.
  const scoopsPerFlavor = Array.from({ length: FLAVOR_COUNT }, (_, fi) =>
    bars.reduce(
      (acc, isBar, i) => acc + (!isBar && flavorIndex(i) === fi ? 1 : 0),
      0,
    ),
  );

  function toggle(i: number) {
    if (splitDone) return;
    setBars((prev) => {
      if (prev[i]) {
        const next = [...prev];
        next[i] = false;
        return next;
      }
      if (barCount >= BARS) return prev;
      const next = [...prev];
      next[i] = true;
      return next;
    });
  }
  function onScoops(raw: string) {
    if (splitDone) return;
    setScoopsInput(raw.replace(/\D/g, "").slice(0, 2));
  }
  function onBars(raw: string) {
    if (splitDone) return;
    setBarsInput(raw.replace(/\D/g, "").slice(0, 2));
  }
  function tryComplete(tStr: string, wStr: string) {
    if (
      !solved &&
      splitDone &&
      tStr !== "" &&
      wStr !== "" &&
      Number(tStr) === TOTAL &&
      Number(wStr) === BARS
    ) {
      setSolved(true);
      onComplete();
    }
  }
  function onTotal(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 2);
    setTotalInput(d);
    tryComplete(d, wafersInput);
  }
  function onWafers(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 2);
    setWafersInput(d);
    tryComplete(totalInput, d);
  }
  function reset() {
    if (splitDone) return;
    setBars(Array(LOCATIONS).fill(false));
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Split the tower"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        This tower has <b>{LOCATIONS} stacked spots</b>. Tap <b>{BARS}</b> of
        them to drop in <b>wafer bars</b>. Scoops fill the rest, and a new flavor
        starts above every wafer — so the number of wafers is always{" "}
        <b>one fewer than the flavors</b> ({BARS} wafers → {FLAVOR_COUNT}{" "}
        flavors).
      </p>

      {/* The vertical tower (bottom → top), with a callback to the friends slide */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <div className="flex flex-col items-center">
          <div className="flex w-48 flex-col-reverse gap-1">
            {Array.from({ length: LOCATIONS }, (_, i) => {
              const isBar = bars[i];
              const f = FLAVORS[flavorIndex(i)];
              const canTap = !splitDone && (isBar || barCount < BARS);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  disabled={!canTap}
                  aria-label={`location ${i + 1}`}
                  className="flex items-center gap-2"
                >
                  <span className="w-4 text-right text-[10px] font-bold text-stone-300">
                    {i + 1}
                  </span>
                  {isBar ? <WaferBar /> : <ScoopLayer color={f.scoop} />}
                </button>
              );
            })}
          </div>
          {/* Cone base */}
          <div className="ml-6 h-0 w-0 border-x-[26px] border-t-[40px] border-x-transparent border-t-amber-700" />
        </div>

        <aside className="max-w-[9rem] rounded-xl bg-rose-50 p-3 text-[11px] leading-snug text-rose-900 ring-1 ring-rose-100">
          Remember the <b>friends</b> from the last slide? Each <b>flavor</b> is
          like a friend who keeps the scoops above their wafer. The wafers are
          just the dividers between friends — so there's always{" "}
          <b>one fewer wafer than flavors</b>.
        </aside>
      </div>

      <p className="mt-2 text-center text-[12px] font-semibold text-stone-400">
        {placedAll
          ? `${BARS} wafers = ${FLAVOR_COUNT} flavors − 1`
          : `${BARS - barCount} more bar${BARS - barCount === 1 ? "" : "s"} to place`}
      </p>

      {/* Step 1: read off the split (dark readout box, like slide 2) */}
      {placedAll && (
        <div className="mt-4 animate-fade-in-up rounded-2xl bg-stone-900 p-4 text-white">
          {/* Each flavor's haul, just like each friend's payout last slide */}
          <p className="text-center text-[12px] font-semibold text-stone-300">
            Each flavor keeps the scoops above its wafer
          </p>
          <div className="mb-3 mt-2 flex justify-center gap-2">
            {scoopsPerFlavor.map((cnt, fi) => (
              <div
                key={fi}
                className="flex flex-1 flex-col items-center rounded-xl bg-white/10 py-2"
              >
                <span className={`h-5 w-5 rounded-full ${FLAVORS[fi].dot}`} />
                <span className="mt-1 text-[11px] font-semibold text-stone-200">
                  {FLAVORS[fi].name}
                </span>
                <span className="text-base font-extrabold text-emerald-300">
                  {cnt} {cnt === 1 ? "scoop" : "scoops"}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end justify-center gap-4">
            <Field
              label="scoops"
              value={scoopsInput}
              onChange={onScoops}
              correct={scoopsCorrect}
              solved={splitDone}
            />
            <Field
              label="bars"
              value={barsInput}
              onChange={onBars}
              correct={barsCorrect}
              solved={splitDone}
            />
          </div>
          <p className="mt-3 text-center text-[13px] text-stone-300">
            {splitDone
              ? `${SCOOPS} scoops and ${BARS} bars fill the ${LOCATIONS} spots.`
              : "With the bars in, how many scoops and how many bars fill the tower?"}
          </p>
        </div>
      )}

      {/* Step 2: count the towers with the combination formula */}
      {splitDone && (
        <div className="mt-3 animate-fade-in-up rounded-2xl bg-stone-900 p-4 text-white">
          <p className="text-center text-[13px] font-semibold text-stone-200">
            How many ice cream towers are possible?
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold">
            <span>C(</span>
            <Field
              label="total spots"
              value={totalInput}
              onChange={onTotal}
              correct={totalCorrect}
              solved={solved}
            />
            <span>,</span>
            <Field
              label="wafers"
              value={wafersInput}
              onChange={onWafers}
              correct={wafersCorrect}
              solved={solved}
            />
            <span>) =</span>
            <span
              aria-label="towers result"
              className={`min-w-[3.5rem] rounded-lg px-2 py-1 text-center ring-2 ${
                result !== null && solved
                  ? "bg-emerald-400/20 text-emerald-300 ring-emerald-400"
                  : "bg-white/10 text-brand-200 ring-white/20"
              }`}
            >
              {result ?? "?"}
            </span>
          </div>
          <p className="mt-2 text-center text-[12px] text-stone-400">
            total spots = wafers + scoops; choose which spots are wafers.
          </p>
          {solved && (
            <p className="mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-center text-[13px] font-semibold text-emerald-300">
              {result} possible ice creams, every tower is one way to choose the{" "}
              {BARS} wafer spots out of {TOTAL}.
            </p>
          )}
        </div>
      )}

      {barCount > 0 && !splitDone && (
        <button onClick={reset} className="btn-ghost mt-3 w-full">
          Reset
        </button>
      )}
    </div>
  );
}

/** One scoop = a horizontal layer in the tower, colored by its flavor. */
function ScoopLayer({ color }: { color: string }) {
  return (
    <span
      className={`flex h-9 flex-1 animate-pop-in items-center rounded-full px-3 shadow-sm ring-1 ring-black/5 ${color}`}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-white/50" />
    </span>
  );
}

/** One bar = a wafer divider spanning the tower. */
function WaferBar() {
  return (
    <span className="flex h-5 flex-1 items-center justify-center gap-1 rounded-md bg-amber-400 shadow-sm ring-1 ring-amber-600/40">
      <span className="h-2.5 w-0.5 rounded bg-amber-600/50" />
      <span className="h-2.5 w-0.5 rounded bg-amber-600/50" />
      <span className="h-2.5 w-0.5 rounded bg-amber-600/50" />
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  correct,
  solved,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  correct: boolean;
  solved: boolean;
}) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        disabled={solved}
        className={`w-14 rounded-lg px-1 py-1 text-center text-2xl font-extrabold outline-none transition ${
          correct
            ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
            : value.trim() !== ""
              ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
              : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
        }`}
      />
    </span>
  );
}
