import { useState } from "react";
import type { GeneratedQuestion } from "../../types";
import type { QuizQuestionSpec, QuizQuestionViewProps } from "../QuizQuestionSpec";
import { combinations, factorial, permutations, type Rng } from "../rng";
import { Feedback, QuestionShell } from "./shared";
import { useMascotOptional } from "../../mascot/mascot-context";
import { combinationBoxes } from "../../mascot/boxExplanations";

/**
 * Lesson 4: order doesn't matter, no reuse: C(n, k).
 *
 * Every question is a guided derivation in three steps, all shown at once:
 *   1. Permutation: fill P(n, k), the n, the k, and the resulting count.
 *   2. Orderings:   fill k!, the base k and its factorial value.
 *   3. Combine:     fill C(n, k) = P(n, k) / k!, every number, then the result.
 *
 * Nothing is graded until the learner presses Submit: no field reveals whether
 * it's right while typing, and a single mistake anywhere fails the whole
 * question. On a wrong submit, Brilli the Ant walks every box that was missed.
 *
 * Each sub-problem comes with a no-feedback sandbox to *experiment* with
 * arrangements: it never shows a running count, the list of orderings, or any
 * multiplication, so the learner has to work out each number themselves.
 */

type Theme = {
  /** Choose {k} {chosen} from {n} {pool}. */
  pool: string;
  chosen: string;
};

const THEMES: Theme[] = [
  { pool: "players", chosen: "a team" },
  { pool: "students", chosen: "a committee" },
  { pool: "pizza toppings", chosen: "a combo" },
  { pool: "books", chosen: "a stack to borrow" },
  { pool: "friends", chosen: "a group photo" },
];

type Person = { id: string; label: string; color: string };
const PALETTE = [
  "bg-rose-400",
  "bg-brand-400",
  "bg-amber-400",
  "bg-umber-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-brand-400",
  "bg-orange-400",
  "bg-brand-400",
  "bg-brand-400",
];
const PEOPLE: Person[] = Array.from({ length: 10 }, (_, i) => ({
  id: String.fromCharCode(97 + i),
  label: String.fromCharCode(65 + i),
  color: PALETTE[i % PALETTE.length],
}));

function generate(rng: Rng): GeneratedQuestion {
  const n = rng.int(5, 10);
  // Keep k small (2–3) so the experiment sandbox stays legible on a phone.
  const k = rng.int(2, 3);
  const theme = rng.int(0, THEMES.length - 1);
  return { params: { n, k, theme }, answer: combinations(n, k) };
}

/* ------------------------------ shared bits ------------------------------ */

type FieldState = "idle" | "correct" | "wrong" | "corrected";

function Badge({ p, big }: { p: Person; big?: boolean }) {
  const size = big ? "h-9 w-9 text-base" : "h-7 w-7 text-sm";
  return (
    <span
      className={`inline-flex ${size} items-center justify-center rounded-lg font-extrabold text-white ${p.color}`}
    >
      {p.label}
    </span>
  );
}

function NumInput({
  label,
  value,
  onChange,
  onEnter,
  disabled,
  state,
  width = "w-14",
  boxId,
}: {
  label: string;
  value: string;
  onChange(v: string): void;
  onEnter(): void;
  disabled: boolean;
  state: FieldState;
  width?: string;
  boxId?: string;
}) {
  const ring =
    state === "corrected"
      ? "border-lime-400 bg-lime-100 text-lime-700"
      : state === "correct"
        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
        : state === "wrong"
          ? "border-red-400 bg-red-50 text-red-600"
          : "border-umber-300 bg-white text-stone-800 focus:border-umber-500";
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      data-ant-box={boxId}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") onEnter();
      }}
      autoComplete="off"
      placeholder="?"
      className={`${width} rounded-lg border-2 px-1 py-1.5 text-center text-xl font-extrabold tabular-nums outline-none transition placeholder:text-stone-300 disabled:opacity-70 ${ring}`}
    />
  );
}

/**
 * A no-feedback playground: drop chips into slots to *try out* arrangements.
 * Deliberately shows no count, no list of orderings, and no multiplication.
 * It's only here so the learner can build intuition before answering.
 */
function Sandbox({
  pool,
  slots,
  locked,
}: {
  pool: Person[];
  slots: number;
  locked: boolean;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const full = placed.length === slots;
  const available = pool.filter((p) => !placed.includes(p.id));

  function place(id: string) {
    if (locked || full || placed.includes(id)) return;
    setPlaced((prev) => [...prev, id]);
  }
  function reset() {
    if (locked) return;
    setPlaced([]);
  }

  return (
    <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-stone-100">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {Array.from({ length: slots }, (_, i) => {
          const id = placed[i];
          const p = pool.find((x) => x.id === id);
          const isNext = i === placed.length && !full;
          return (
            <div
              key={i}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition ${
                p
                  ? "border-umber-300 bg-white"
                  : isNext
                    ? "border-umber-400 bg-umber-50"
                    : "border-dashed border-stone-300 bg-white"
              }`}
            >
              {p ? (
                <Badge p={p} big />
              ) : (
                <span className="text-xs font-bold text-stone-300">
                  {i + 1}
                </span>
              )}
            </div>
          );
        })}
        <button
          onClick={reset}
          disabled={locked || placed.length === 0}
          aria-label="reset sandbox"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition active:scale-90 disabled:opacity-40"
        >
          ↺
        </button>
      </div>

      <div className="mt-3 flex min-h-[36px] flex-wrap items-center justify-center gap-1.5">
        {available.map((p) => (
          <button
            key={p.id}
            onClick={() => place(p.id)}
            disabled={locked || full}
            aria-label={`place ${p.label}`}
            className="transition active:scale-90 disabled:opacity-40"
          >
            <Badge p={p} />
          </button>
        ))}
      </div>

      <p className="mt-2 text-center text-[11px] text-stone-400">
        Tap to try arrangements, just to explore.
      </p>
    </div>
  );
}

function StepDot({ done, n }: { done: boolean; n: number }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition ${
        done ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-500"
      }`}
    >
      {done ? "✓" : n}
    </span>
  );
}

/* --------------------------- the derivation view --------------------------- */

type Key =
  | "pN"
  | "pK"
  | "pCount"
  | "kBase"
  | "kCount"
  | "cN"
  | "cK"
  | "num"
  | "den"
  | "result";

const EMPTY: Record<Key, string> = {
  pN: "",
  pK: "",
  pCount: "",
  kBase: "",
  kCount: "",
  cN: "",
  cK: "",
  num: "",
  den: "",
  result: "",
};

function CombinationQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const mascot = useMascotOptional();
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const answer = Number(question.answer);
  const t = THEMES[Number(question.params.theme)] ?? THEMES[0];

  const P = permutations(n, k);
  const kf = factorial(k);
  const team = PEOPLE.slice(0, k);

  const expected: Record<Key, number> = {
    pN: n,
    pK: k,
    pCount: P,
    kBase: k,
    kCount: kf,
    cN: n,
    cK: k,
    num: P,
    den: kf,
    result: answer,
  };

  const [vals, setVals] = useState<Record<Key, string>>({ ...EMPTY });
  const [submitted, setSubmitted] = useState(false);
  const [corrected, setCorrected] = useState<Set<string>>(() => new Set());
  const markCorrected = (id: string) =>
    setCorrected((prev) => new Set(prev).add(id));
  const isLocked = locked || submitted;

  const ok = (key: Key) =>
    vals[key].trim() !== "" && Number(vals[key]) === expected[key];
  const filled = (key: Key) => vals[key].trim() !== "";

  // Every box is part of the answer now, so all three steps must be right, and
  // nothing is graded until Submit.
  const ALL_KEYS: Key[] = [
    "pN",
    "pK",
    "pCount",
    "kBase",
    "kCount",
    "cN",
    "cK",
    "num",
    "den",
    "result",
  ];
  const step1Correct = ok("pN") && ok("pK") && ok("pCount");
  const step2Correct = ok("kBase") && ok("kCount");
  const step3Correct =
    ok("cN") && ok("cK") && ok("num") && ok("den") && ok("result");

  const ready = ALL_KEYS.every(filled);
  const allCorrect = ALL_KEYS.every(ok);
  const correct = submitted && allCorrect;

  function setVal(key: Key, v: string) {
    if (isLocked) return;
    setVals((prev) => ({ ...prev, [key]: v }));
  }
  function submit() {
    if (!ready || isLocked) return;
    setSubmitted(true);
    onResult(allCorrect);
    if (!allCorrect) {
      const boxes = combinationBoxes({ n, k, answer, P, kf, params: question.params });
      const stops = ALL_KEYS.filter((key) => !ok(key)).map((key) => ({
        ...boxes[key],
        fix: () => {
          setVals((prev) => ({ ...prev, [key]: String(expected[key]) }));
          markCorrected(`comb-${key}`);
        },
      }));
      mascot?.reviewBoxes(stops);
    }
  }

  // No field reveals correctness while typing; only after Submit do boxes turn
  // green/red (a Brilli-corrected box turns lime).
  const fieldState = (key: Key): FieldState =>
    corrected.has(`comb-${key}`)
      ? "corrected"
      : !submitted
        ? "idle"
        : ok(key)
          ? "correct"
          : "wrong";

  const field = (key: Key, label: string, width?: string) => (
    <NumInput
      label={label}
      value={vals[key]}
      onChange={(v) => setVal(key, v)}
      onEnter={submit}
      disabled={isLocked}
      state={fieldState(key)}
      width={width}
      boxId={`comb-${key}`}
    />
  );

  const prompt = (
    <>
      From <b>{n}</b> {t.pool}, you choose <b>{k}</b> to form {t.chosen}. Order
      doesn't matter. Fill in all three steps, then submit. Every box has to be
      right.
    </>
  );

  return (
    <QuestionShell tag="Order doesn't matter · no reuse" prompt={prompt}>
      <div className="mt-5 space-y-4">
        {/* Step 1: permutation */}
        <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-100">
          <div className="flex items-center gap-2">
            <StepDot done={submitted && step1Correct} n={1} />
            <p className="text-[13px] font-semibold text-stone-700">
              Order matters first: how many ways to pick <b>{k}</b> of the{" "}
              <b>{n}</b> {t.pool} <i>in order</i>?
            </p>
          </div>
          <Sandbox pool={PEOPLE.slice(0, n)} slots={k} locked={isLocked} />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-lg font-extrabold text-stone-700">
            <span>P(</span>
            {field("pN", "permutation n")}
            <span>,</span>
            {field("pK", "permutation k")}
            <span>) =</span>
            {field("pCount", "permutation count")}
          </div>
        </div>

        {/* Step 2: k! */}
        <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-100">
          <div className="flex items-center gap-2">
            <StepDot done={submitted && step2Correct} n={2} />
            <p className="text-[13px] font-semibold text-stone-700">
              Now take one team of <b>{k}</b>. How many ways can you arrange{" "}
              <i>just them</i>?
            </p>
          </div>
          <Sandbox pool={team} slots={k} locked={isLocked} />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-lg font-extrabold text-stone-700">
            {field("kBase", "k base")}
            <span>! =</span>
            {field("kCount", "k factorial count")}
          </div>
        </div>

        {/* Step 3: divide */}
        <div className="rounded-2xl border-2 border-umber-200 bg-umber-50/50 p-4">
          <div className="flex items-center gap-2">
            <StepDot done={submitted && step3Correct} n={3} />
            <p className="text-[13px] font-semibold text-stone-700">
              Order doesn't matter, so divide out the orderings.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold text-stone-700">
            <span>C(</span>
            {field("cN", "combination n")}
            <span>,</span>
            {field("cK", "combination k")}
            <span>) =</span>
            {field("num", "numerator")}
            <span>/</span>
            {field("den", "denominator")}
            <span>=</span>
            {field("result", "combination result", "w-20")}
          </div>
        </div>

        {submitted ? (
          <Feedback correct={correct} answer={answer} unit="ways" />
        ) : (
          <button
            onClick={submit}
            disabled={!ready || isLocked}
            className="inline-flex w-full items-center justify-center rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            Submit
          </button>
        )}
      </div>
    </QuestionShell>
  );
}

export const spec: QuizQuestionSpec = {
  id: "combination",
  lessonId: "l4-comb-no-rep",
  generate,
  Component: CombinationQuestion,
};

export default CombinationQuestion;
