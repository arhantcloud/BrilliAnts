import { useState } from "react";
import type { GeneratedQuestion } from "../../types";
import type { QuizQuestionSpec, QuizQuestionViewProps } from "../QuizQuestionSpec";
import { combinations, factorial, permutations, type Rng } from "../rng";
import { Feedback, QuestionShell } from "./shared";

/**
 * Lesson 4 — order doesn't matter, no reuse: C(n, k).
 *
 * Every question is a guided derivation in three gated steps:
 *   1. Permutation: fill P(n, k) — the n, the k, and the resulting count.
 *   2. Orderings:   fill k! — the base k and its factorial value.
 *   3. Combine:     fill C(n, k) = P(n, k) / k! — every number, then the result.
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
  "bg-sky-400",
  "bg-amber-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-pink-400",
  "bg-blue-400",
  "bg-orange-400",
  "bg-teal-400",
  "bg-fuchsia-400",
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

type FieldState = "idle" | "correct" | "wrong";

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
}: {
  label: string;
  value: string;
  onChange(v: string): void;
  onEnter(): void;
  disabled: boolean;
  state: FieldState;
  width?: string;
}) {
  const ring =
    state === "correct"
      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
      : state === "wrong"
        ? "border-red-400 bg-red-50 text-red-600"
        : "border-violet-300 bg-white text-slate-800 focus:border-violet-500";
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") onEnter();
      }}
      autoComplete="off"
      placeholder="?"
      className={`${width} rounded-lg border-2 px-1 py-1.5 text-center text-xl font-extrabold tabular-nums outline-none transition placeholder:text-slate-300 disabled:opacity-70 ${ring}`}
    />
  );
}

/**
 * A no-feedback playground: drop chips into slots to *try out* arrangements.
 * Deliberately shows no count, no list of orderings, and no multiplication —
 * it's only here so the learner can build intuition before answering.
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
    <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-100">
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
                  ? "border-violet-300 bg-white"
                  : isNext
                    ? "border-violet-400 bg-violet-50"
                    : "border-dashed border-slate-300 bg-white"
              }`}
            >
              {p ? (
                <Badge p={p} big />
              ) : (
                <span className="text-xs font-bold text-slate-300">
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
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-90 disabled:opacity-40"
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

      <p className="mt-2 text-center text-[11px] text-slate-400">
        Tap to try arrangements — just to explore.
      </p>
    </div>
  );
}

function StepDot({ done, n }: { done: boolean; n: number }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition ${
        done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
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
  const isLocked = locked || submitted;

  const ok = (key: Key) =>
    vals[key].trim() !== "" && Number(vals[key]) === expected[key];
  const filled = (key: Key) => vals[key].trim() !== "";

  const step1Done = ok("pN") && ok("pK") && ok("pCount");
  const step2Done = ok("kBase") && ok("kCount");
  const step3Keys: Key[] = ["cN", "cK", "num", "den", "result"];
  const step3Filled = step3Keys.every(filled);
  const step3Correct = step3Keys.every(ok);

  const ready = step1Done && step2Done && step3Filled;
  const correct = submitted && step3Correct;

  function setVal(key: Key, v: string) {
    if (isLocked) return;
    setVals((prev) => ({ ...prev, [key]: v }));
  }
  function submit() {
    if (!ready || isLocked) return;
    setSubmitted(true);
    onResult(step3Correct);
  }

  // Sub-problem fields validate live (they're stepping stones, not the answer);
  // the final step stays neutral until submit so the answer isn't revealed.
  const liveState = (key: Key): FieldState =>
    ok(key) ? "correct" : filled(key) ? "wrong" : "idle";
  const finalState = (key: Key): FieldState =>
    !submitted ? "idle" : ok(key) ? "correct" : "wrong";

  const stepField = (key: Key, label: string, done: boolean) => (
    <NumInput
      label={label}
      value={vals[key]}
      onChange={(v) => setVal(key, v)}
      onEnter={() => {}}
      disabled={isLocked || done}
      state={liveState(key)}
    />
  );
  const finalField = (key: Key, label: string, width?: string) => (
    <NumInput
      label={label}
      value={vals[key]}
      onChange={(v) => setVal(key, v)}
      onEnter={submit}
      disabled={isLocked}
      state={finalState(key)}
      width={width}
    />
  );

  const prompt = (
    <>
      From <b>{n}</b> {t.pool}, you choose <b>{k}</b> to form {t.chosen}. Order
      doesn't matter. Work it out in two steps, then divide.
    </>
  );

  return (
    <QuestionShell tag="Order doesn't matter · no reuse" prompt={prompt}>
      <div className="mt-5 space-y-4">
        {/* Step 1 — permutation */}
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <div className="flex items-center gap-2">
            <StepDot done={step1Done} n={1} />
            <p className="text-[13px] font-semibold text-slate-700">
              Order matters first: how many ways to pick <b>{k}</b> of the{" "}
              <b>{n}</b> {t.pool} <i>in order</i>?
            </p>
          </div>
          <Sandbox pool={PEOPLE.slice(0, n)} slots={k} locked={isLocked} />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-lg font-extrabold text-slate-700">
            <span>P(</span>
            {stepField("pN", "permutation n", step1Done)}
            <span>,</span>
            {stepField("pK", "permutation k", step1Done)}
            <span>) =</span>
            {stepField("pCount", "permutation count", step1Done)}
          </div>
        </div>

        {/* Step 2 — k! (revealed after step 1) */}
        {step1Done && (
          <div className="animate-fade-in-up rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex items-center gap-2">
              <StepDot done={step2Done} n={2} />
              <p className="text-[13px] font-semibold text-slate-700">
                Now take one team of <b>{k}</b>. How many ways can you arrange{" "}
                <i>just them</i>?
              </p>
            </div>
            <Sandbox pool={team} slots={k} locked={isLocked} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-lg font-extrabold text-slate-700">
              {stepField("kBase", "k base", step2Done)}
              <span>! =</span>
              {stepField("kCount", "k factorial count", step2Done)}
            </div>
          </div>
        )}

        {/* Step 3 — divide (revealed after step 2) */}
        {step1Done && step2Done && (
          <div className="animate-fade-in-up rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-4">
            <div className="flex items-center gap-2">
              <StepDot done={correct} n={3} />
              <p className="text-[13px] font-semibold text-slate-700">
                Order doesn't matter, so divide out the orderings.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold text-slate-700">
              <span>C(</span>
              {finalField("cN", "combination n")}
              <span>,</span>
              {finalField("cK", "combination k")}
              <span>) =</span>
              {finalField("num", "numerator")}
              <span>/</span>
              {finalField("den", "denominator")}
              <span>=</span>
              {finalField("result", "combination result", "w-20")}
            </div>
          </div>
        )}

        {submitted ? (
          <Feedback correct={correct} answer={answer} unit="ways" />
        ) : (
          <button
            onClick={submit}
            disabled={!ready || isLocked}
            className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
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
