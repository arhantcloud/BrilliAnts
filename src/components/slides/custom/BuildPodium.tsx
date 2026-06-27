import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

type Car = { id: string; name: string; color: string };

const CARS: Car[] = [
  { id: "c1", name: "1", color: "bg-rose-500" },
  { id: "c2", name: "2", color: "bg-brand-500" },
  { id: "c3", name: "3", color: "bg-emerald-500" },
  { id: "c4", name: "4", color: "bg-amber-500" },
  { id: "c5", name: "5", color: "bg-umber-500" },
];

const N = CARS.length; // 5 cars
const PODIUM = 3; // 1st, 2nd, 3rd
const PRODUCT = 5 * 4 * 3; // 60
const PLACES = ["1st", "2nd", "3rd"];
const CROSS_MS = 850; // how long a car takes to race across the line

function car(id: string) {
  return CARS.find((c) => c.id === id)!;
}

/** All ordered podiums: permutations of N cars taken PODIUM at a time (60). */
function kPerms<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  return arr.flatMap((item, i) =>
    kPerms([...arr.slice(0, i), ...arr.slice(i + 1)], k - 1).map((rest) => [
      item,
      ...rest,
    ]),
  );
}
const ALL_PODIUMS = kPerms(
  CARS.map((c) => c.id),
  PODIUM,
);

export default function BuildPodium({ slide, onComplete }: CustomSlideProps) {
  const [finished, setFinished] = useState<string[]>([]);
  const [choiceInput, setChoiceInput] = useState("");
  const [crossingId, setCrossingId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState(false);

  const full = finished.length === PODIUM;
  const crossing = crossingId !== null;
  const awaitingChoice = !full && !crossing && !solved;
  const expected = N - finished.length; // choices for the current spot
  // One term per spot decided; the new term appears as soon as a car sets off.
  const lockedCount = finished.length + (crossing ? 1 : 0);

  const answerCorrect =
    full && answer.trim() !== "" && Number(answer) === PRODUCT;
  const choiceWrong =
    awaitingChoice &&
    choiceInput.trim() !== "" &&
    Number(choiceInput) !== expected;

  // When a car is sent off, let it drive across the line, then lock it onto the
  // podium for that spot.
  useEffect(() => {
    if (crossingId == null) return;
    const t = setTimeout(() => {
      setFinished((f) => [...f, crossingId]);
      setCrossingId(null);
    }, CROSS_MS);
    return () => clearTimeout(t);
  }, [crossingId]);

  function onChoiceChange(raw: string) {
    if (!awaitingChoice || solved) return;
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setChoiceInput(digits);
    if (digits !== "" && Number(digits) === expected) {
      // Pick a random car still in the race to take this spot.
      const remaining = CARS.filter((c) => !finished.includes(c.id));
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      setChoiceInput("");
      setCrossingId(pick.id);
    }
  }

  function onAnswerChange(raw: string) {
    if (solved) return;
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    setAnswer(digits);
    if (full && digits !== "" && Number(digits) === PRODUCT) {
      setSolved(true);
      onComplete();
    }
  }

  function reset() {
    if (solved) return;
    setFinished([]);
    setChoiceInput("");
    setCrossingId(null);
    setAnswer("");
  }

  const terms = Array.from({ length: lockedCount }, (_, i) => N - i);
  const builtKey = finished.join("-");

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Race to the podium"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Five cars race. How many possible <b>podiums</b> (1st, 2nd, 3rd) are
        there? For each spot, enter how many cars could finish there, a random
        car then races across the line.
      </p>

      {/* Prompt box (top): per-spot choice gate / slide hint */}
      <div className="mt-4 min-h-[64px]">
        {awaitingChoice && (
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-brand-900">
              {PLACES[finished.length]} place: how many cars could finish here?
            </p>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                aria-label={`choices for ${PLACES[finished.length]} place`}
                value={choiceInput}
                onChange={(e) => onChoiceChange(e.target.value)}
                placeholder="?"
                className={`w-16 rounded-lg border-2 bg-white px-2 py-1.5 text-center text-xl font-extrabold outline-none transition ${
                  choiceWrong
                    ? "border-red-400 text-red-500"
                    : "border-brand-300 text-brand-700 focus:border-brand-500"
                }`}
              />
              <span className="text-[13px] text-stone-500">
                {choiceWrong
                  ? "Count the cars still racing (not yet finished)."
                  : "Type the number of cars still in the race."}
              </span>
            </div>
          </div>
        )}

        {crossing && (
          <p className="animate-fade-in rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            And they're off! A car is racing across the line for{" "}
            {PLACES[finished.length]} place →
          </p>
        )}

        {full && !solved && (
          <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-600">
            Podium set! Now fill in the total below.
          </p>
        )}
      </div>

      {/* Multiplication: typed choices stack up. */}
      <div className="mt-3 rounded-2xl bg-stone-900 p-5 text-center text-white">
        {lockedCount === 0 ? (
          <p className="text-sm text-stone-400">
            Enter the choices for 1st place to begin.
          </p>
        ) : (
          <>
            <p className="flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold tracking-wide">
              <span>{terms.join(" × ")}</span>
              {!full && <span className="text-stone-500">× …</span>}
              {full && (
                <>
                  <span>=</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="number of possible podiums"
                    value={answer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    placeholder="?"
                    disabled={solved}
                    className={`w-20 rounded-lg px-2 py-1 text-center text-2xl font-extrabold outline-none transition ${
                      answerCorrect
                        ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
                        : answer.trim() !== ""
                          ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
                          : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
                    }`}
                  />
                </>
              )}
            </p>
            <p className="mt-2 text-[13px] text-stone-300">
              {solved
                ? "60 possible podiums = 5 × 4 × 3. Order matters and no car repeats, so it's a permutation."
                : full
                  ? answerCorrect
                    ? ""
                    : answer.trim() === ""
                      ? "Now multiply the choices and fill in the total."
                      : "Not quite, multiply 5 × 4 × 3."
                  : "Each spot has one fewer choice than the last."}
            </p>
          </>
        )}
      </div>

      {/* Race track: 5 lanes. A random car drives to the line per spot. */}
      <div className="relative mt-3 rounded-2xl bg-stone-200 p-3">
        <div className="space-y-2">
          {CARS.map((c, i) => {
            const place = finished.indexOf(c.id);
            const isFinished = place >= 0;
            const isCrossing = crossingId === c.id;
            const atLine = isFinished || isCrossing; // parked or driving across
            return (
              <div key={c.id} className="relative h-9 rounded-lg">
                <div className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 bg-white/70" />
                <div
                  className="absolute top-1/2 z-10 flex items-center gap-1.5"
                  style={{
                    left: atLine ? "calc(100% - 0.55rem)" : "0.25rem",
                    transform: atLine
                      ? "translate(-100%, -50%)"
                      : "translate(0, -50%)",
                    transition: `left ${CROSS_MS}ms cubic-bezier(0.45,0.05,0.25,1), transform ${CROSS_MS}ms cubic-bezier(0.45,0.05,0.25,1)`,
                  }}
                >
                  {isFinished && (
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-stone-500 shadow-sm">
                      {PLACES[place]}
                    </span>
                  )}
                  <span
                    className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-sm font-bold text-white shadow ${c.color} ${
                      atLine ? "" : "race-rev"
                    }`}
                    style={atLine ? undefined : { animationDelay: `${i * 0.13}s` }}
                  >
                    <span aria-hidden>🏎</span> {c.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="finish-line absolute bottom-3 right-3 top-3 w-2.5 rounded" />
      </div>

      {/* All possible podiums: highlight the one just built (after solving). */}
      {solved && (
        <div className="mt-4 animate-fade-in rounded-2xl bg-stone-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-stone-300">
              All possible podiums
            </p>
            <p className="text-[13px] font-bold text-brand-300">
              your podium is 1 of {ALL_PODIUMS.length}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {ALL_PODIUMS.map((order) => {
              const key = order.join("-");
              const on = key === builtKey;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-center gap-0.5 rounded-md py-1 transition ${
                    on
                      ? "bg-brand-500 ring-2 ring-brand-300"
                      : "bg-white/5 opacity-50"
                  }`}
                >
                  {order.map((id) => (
                    <span
                      key={id}
                      className={`h-3.5 w-4 rounded-[3px] text-center text-[9px] font-bold leading-[14px] text-white ${car(id).color}`}
                    >
                      {car(id).name}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {finished.length > 0 && !solved && (
        <button onClick={reset} className="btn-ghost mt-3 w-full">
          Reset race
        </button>
      )}
    </div>
  );
}
