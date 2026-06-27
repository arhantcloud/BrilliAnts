import { useState, type ReactNode } from "react";
import type { GeneratedQuestion } from "../../types";
import type { QuizQuestionSpec, QuizQuestionViewProps } from "../QuizQuestionSpec";
import { permutations, type Rng } from "../rng";
import { Feedback, QuestionShell } from "./shared";
import { useMascotOptional } from "../../mascot/mascot-context";
import type { AntStop } from "../../mascot/mascot-context";
import {
  permCrossOutBoxes,
  permFormulaBoxes,
  permProductBoxes,
} from "../../mascot/boxExplanations";

/**
 * Lesson 2: order matters, no reuse: P(n, k) = n! / (n − k)!.
 *
 * Three interaction styles (picked per question by the quiz's style plan), each
 * a genuine derivation of the count rather than a different way to type a number:
 *   0. cross-out      : strike the tail factors of n! that cancel
 *   1. fill-formula   : fill P(n,k)=n!/(n−k)! with the values and the result (no hints)
 *   2. descending     : write the count as the product of the per-step choices
 * Nothing on screen states the answer.
 */

type Theme = { pool: string; place: string };

const THEMES: Theme[] = [
  { pool: "sprinters", place: "podium places" },
  { pool: "students", place: "ranked council roles" },
  { pool: "songs", place: "playlist openers" },
  { pool: "horses", place: "finishing positions" },
  { pool: "books", place: "front-window slots" },
];

function generate(rng: Rng): GeneratedQuestion {
  const n = rng.int(5, 7);
  const k = rng.int(2, 3);
  const theme = rng.int(0, THEMES.length - 1);
  return { params: { n, k, theme }, answer: permutations(n, k) };
}

/* ------------------------------ shared bits ------------------------------ */

type BodyProps = {
  n: number;
  k: number;
  answer: number;
  theme: Theme;
  locked: boolean;
  params: Record<string, number | string>;
  onResult(correct: boolean): void;
};

type FieldState = "idle" | "correct" | "wrong" | "corrected";

/** A small numeric blank used inside the formula/product styles. */
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

function SubmitOrFeedback({
  submitted,
  ready,
  isLocked,
  onSubmit,
  correct,
  answer,
}: {
  submitted: boolean;
  ready: boolean;
  isLocked: boolean;
  onSubmit(): void;
  correct: boolean;
  answer: number;
}) {
  if (submitted) return <Feedback correct={correct} answer={answer} unit="ways" />;
  return (
    <button
      onClick={onSubmit}
      disabled={!ready || isLocked}
      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
    >
      Submit
    </button>
  );
}

/* --------------------------- style 0: cross out -------------------------- */

function CrossOut({ n, k, answer, theme, params, locked, onResult }: BodyProps) {
  const mascot = useMascotOptional();
  const factors = Array.from({ length: n }, (_, i) => n - i); // n, n-1, ..., 1
  const cancelCount = n - k; // the tail (n−k)! that cancels

  const [crossed, setCrossed] = useState<Set<number>>(() => new Set());
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [corrected, setCorrected] = useState<Set<string>>(() => new Set());
  const markCorrected = (id: string) =>
    setCorrected((prev) => new Set(prev).add(id));

  const isLocked = locked || submitted;
  const interactionOk = factors.every((f) =>
    f <= cancelCount ? crossed.has(f) : !crossed.has(f),
  );
  const interactionDone = crossed.size > 0;
  const ready = interactionDone && value.trim() !== "";
  const correct = submitted && interactionOk && Number(value) === answer;

  function toggle(f: number) {
    if (isLocked) return;
    setCrossed((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  function submit() {
    if (isLocked || !ready) return;
    const valueOk = Number(value) === answer;
    setSubmitted(true);
    onResult(interactionOk && valueOk);
    if (!(interactionOk && valueOk)) {
      const boxes = permCrossOutBoxes({ n, k, answer, pool: theme.pool, params });
      const stops: AntStop[] = [];
      if (!interactionOk)
        stops.push({
          ...boxes.crossout,
          fix: () => {
            setCrossed(
              new Set(Array.from({ length: cancelCount }, (_, i) => i + 1)),
            );
            markCorrected("perm-crossout");
          },
        });
      if (!valueOk)
        stops.push({
          ...boxes.result,
          fix: () => {
            setValue(String(answer));
            markCorrected("perm-crossout-result");
          },
        });
      mascot?.reviewBoxes(stops);
    }
  }

  return (
    <>
      <p className="mt-4 text-[13px] text-stone-600">
        Writing out <b>{n}!</b> counts every full lineup of all {n}. But you only
        fill <b>{k}</b> spots, so the tail factors cancel. <b>Cross out</b> the
        factors that cancel away. What's left is the count.
      </p>

      <div
        data-ant-box="perm-crossout"
        className={`mt-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl border-2 bg-umber-50/40 p-4 ${
          corrected.has("perm-crossout")
            ? "border-lime-400 ring-2 ring-lime-300"
            : "border-umber-100"
        }`}
      >
        {factors.map((f, i) => {
          const isCrossed = crossed.has(f);
          const shouldCross = f <= cancelCount;
          const wrong = submitted && isCrossed !== shouldCross;
          const fixedRemain = corrected.has("perm-crossout") && !isCrossed;
          return (
            <div key={f} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`factor ${f}`}
                aria-pressed={isCrossed}
                disabled={isLocked}
                onClick={() => toggle(f)}
                className={`relative h-11 w-11 rounded-xl border-2 text-xl font-extrabold tabular-nums transition ${
                  fixedRemain
                    ? "border-lime-400 bg-lime-100 text-lime-700"
                    : wrong
                      ? "border-red-400 bg-red-50 text-red-500"
                      : isCrossed
                        ? "border-stone-200 bg-stone-100 text-stone-300"
                        : "border-umber-300 bg-white text-stone-800 hover:border-umber-500"
                }`}
              >
                {f}
                {isCrossed && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="h-0.5 w-9 -rotate-12 rounded bg-stone-400" />
                  </span>
                )}
              </button>
              {i < factors.length - 1 && (
                <span className="text-lg font-bold text-stone-300">×</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-stone-900 p-5 text-white">
        <label
          htmlFor="perm-final-answer"
          className="block text-[11px] font-bold uppercase tracking-[0.18em] text-umber-300"
        >
          How many ordered outcomes in total?
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="perm-final-answer"
            type="text"
            inputMode="numeric"
            aria-label="Final answer"
            data-ant-box="perm-crossout-result"
            value={value}
            disabled={isLocked}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            autoComplete="off"
            placeholder="?"
            className={`w-32 rounded-xl border-2 bg-white/10 px-3 py-2 text-center text-xl font-extrabold tabular-nums text-white outline-none transition placeholder:text-stone-500 focus:border-umber-400 disabled:opacity-60 ${
              corrected.has("perm-crossout-result")
                ? "border-lime-400 bg-lime-400/20"
                : submitted
                  ? Number(value) === answer
                    ? "border-emerald-400"
                    : "border-red-400"
                  : "border-white/20"
            }`}
          />
          <span className="text-sm font-semibold text-stone-400">ways</span>
        </div>
      </div>

      <SubmitOrFeedback
        submitted={submitted}
        ready={ready}
        isLocked={isLocked}
        onSubmit={submit}
        correct={correct}
        answer={answer}
      />
    </>
  );
}

/* ------------------------- style 1: fill formula ------------------------- */

type FormulaKey = "notN" | "notK" | "numN" | "denN" | "denK" | "res";
const FORMULA_KEYS: FormulaKey[] = ["notN", "notK", "numN", "denN", "denK", "res"];

function FillFormula({ n, k, answer, theme, params, locked, onResult }: BodyProps) {
  const mascot = useMascotOptional();
  const expected: Record<FormulaKey, number> = {
    notN: n,
    notK: k,
    numN: n,
    denN: n,
    denK: k,
    res: answer,
  };
  const [vals, setVals] = useState<Record<FormulaKey, string>>({
    notN: "",
    notK: "",
    numN: "",
    denN: "",
    denK: "",
    res: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [corrected, setCorrected] = useState<Set<string>>(() => new Set());
  const markCorrected = (id: string) =>
    setCorrected((prev) => new Set(prev).add(id));
  const isLocked = locked || submitted;

  const allFilled = FORMULA_KEYS.every((key) => vals[key].trim() !== "");
  const ready = allFilled;
  const interactionOk = FORMULA_KEYS.every(
    (key) => Number(vals[key]) === expected[key],
  );
  const correct = submitted && interactionOk;

  function set(key: FormulaKey, v: string) {
    if (isLocked) return;
    setVals((prev) => ({ ...prev, [key]: v }));
  }
  function submit() {
    if (isLocked || !ready) return;
    setSubmitted(true);
    onResult(interactionOk);
    if (!interactionOk) {
      const boxes = permFormulaBoxes({ n, k, answer, pool: theme.pool, params });
      const stops = FORMULA_KEYS.filter(
        (key) => Number(vals[key]) !== expected[key],
      ).map((key) => ({
        ...boxes[key],
        fix: () => {
          setVals((prev) => ({ ...prev, [key]: String(expected[key]) }));
          markCorrected(`perm-${key}`);
        },
      }));
      mascot?.reviewBoxes(stops);
    }
  }
  function fieldState(key: FormulaKey): FieldState {
    if (corrected.has(`perm-${key}`)) return "corrected";
    if (!submitted) return "idle";
    return Number(vals[key]) === expected[key] ? "correct" : "wrong";
  }

  const field = (key: FormulaKey, label: string, width?: string) => (
    <NumInput
      label={label}
      value={vals[key]}
      onChange={(v) => set(key, v)}
      onEnter={submit}
      disabled={isLocked}
      state={fieldState(key)}
      width={width}
      boxId={`perm-${key}`}
    />
  );

  return (
    <>
      <p className="mt-4 text-[13px] text-stone-600">
        Fill in the permutation formula with the values, then compute the result.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-4 rounded-2xl border-2 border-umber-100 bg-umber-50/40 p-5 text-2xl font-extrabold text-stone-700">
        <span>P(</span>
        {field("notN", "formula notation n")}
        <span>,</span>
        {field("notK", "formula notation k")}
        <span>) =</span>

        <span className="inline-flex flex-col items-center text-xl">
          <span className="flex items-center gap-1 pb-1.5">
            {field("numN", "formula numerator n")}
            <span>!</span>
          </span>
          <span className="h-0.5 w-full min-w-[170px] rounded bg-stone-400" />
          <span className="flex items-center gap-1 pt-1.5">
            <span>(</span>
            {field("denN", "formula denominator n")}
            <span>−</span>
            {field("denK", "formula denominator k")}
            <span>)!</span>
          </span>
        </span>

        <span>=</span>
        {field("res", "formula result", "w-20")}
      </div>

      <SubmitOrFeedback
        submitted={submitted}
        ready={ready}
        isLocked={isLocked}
        onSubmit={submit}
        correct={correct}
        answer={answer}
      />
    </>
  );
}

/* ------------------------ style 2: descending product ------------------- */

function DescendingProduct({
  n,
  k,
  answer,
  theme,
  params,
  locked,
  onResult,
}: BodyProps) {
  const mascot = useMascotOptional();
  // P(n,k) = n · (n−1) · … · (n−k+1): k descending factors, then the product.
  const expectedTerms = Array.from({ length: k }, (_, i) => n - i);
  const [terms, setTerms] = useState<string[]>(() => Array(k).fill(""));
  const [result, setResult] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [corrected, setCorrected] = useState<Set<string>>(() => new Set());
  const markCorrected = (id: string) =>
    setCorrected((prev) => new Set(prev).add(id));
  const isLocked = locked || submitted;

  const allFilled =
    terms.every((t) => t.trim() !== "") && result.trim() !== "";
  const ready = allFilled;
  const termsOk = terms.every((t, i) => Number(t) === expectedTerms[i]);
  const interactionOk = termsOk && Number(result) === answer;
  const correct = submitted && interactionOk;

  function setTerm(i: number, v: string) {
    if (isLocked) return;
    setTerms((prev) => prev.map((t, idx) => (idx === i ? v : t)));
  }
  function submit() {
    if (isLocked || !ready) return;
    setSubmitted(true);
    onResult(interactionOk);
    if (!interactionOk) {
      const boxes = permProductBoxes({ n, k, answer, pool: theme.pool, params });
      const stops: AntStop[] = [];
      terms.forEach((t, i) => {
        if (Number(t) !== expectedTerms[i])
          stops.push({
            ...boxes.terms[i],
            fix: () => {
              setTerms((prev) =>
                prev.map((t, idx) =>
                  idx === i ? String(expectedTerms[i]) : t,
                ),
              );
              markCorrected(`perm-term-${i}`);
            },
          });
      });
      if (Number(result) !== answer)
        stops.push({
          ...boxes.result,
          fix: () => {
            setResult(String(answer));
            markCorrected("perm-product-result");
          },
        });
      mascot?.reviewBoxes(stops);
    }
  }
  function termState(i: number): FieldState {
    if (corrected.has(`perm-term-${i}`)) return "corrected";
    if (!submitted) return "idle";
    return Number(terms[i]) === expectedTerms[i] ? "correct" : "wrong";
  }
  const resultState: FieldState = corrected.has("perm-product-result")
    ? "corrected"
    : !submitted
      ? "idle"
      : Number(result) === answer
        ? "correct"
        : "wrong";

  return (
    <>
      <p className="mt-4 text-[13px] text-stone-600">
        Count the choices at each step and write the result as their product,{" "}
        <b>{k}</b> factors in all.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl border-2 border-umber-100 bg-umber-50/40 p-5 text-2xl font-extrabold text-stone-400">
        {terms.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <NumInput
              label={`term ${i + 1}`}
              value={t}
              onChange={(v) => setTerm(i, v)}
              onEnter={submit}
              disabled={isLocked}
              state={termState(i)}
              boxId={`perm-term-${i}`}
            />
            {i < terms.length - 1 && <span>×</span>}
          </div>
        ))}
        <span>=</span>
        <NumInput
          label="product result"
          value={result}
          onChange={setResult}
          onEnter={submit}
          disabled={isLocked}
          state={resultState}
          width="w-20"
          boxId="perm-product-result"
        />
      </div>

      <SubmitOrFeedback
        submitted={submitted}
        ready={ready}
        isLocked={isLocked}
        onSubmit={submit}
        correct={correct}
        answer={answer}
      />
    </>
  );
}

/* ------------------------------- wrapper -------------------------------- */

function PermutationQuestion({ question, locked, onResult }: QuizQuestionViewProps) {
  const n = Number(question.params.n);
  const k = Number(question.params.k);
  const answer = Number(question.answer);
  const style = Number(question.params.style) || 0;
  const theme = THEMES[Number(question.params.theme)] ?? THEMES[0];
  const base: BodyProps = {
    n,
    k,
    answer,
    theme,
    locked,
    onResult,
    params: question.params,
  };

  let prompt: ReactNode;
  let body: ReactNode;

  if (style === 1) {
    prompt = (
      <>
        <b>{n}</b> {theme.pool} compete for <b>{k}</b> ordered {theme.place}.
      </>
    );
    body = <FillFormula {...base} />;
  } else if (style === 2) {
    prompt = (
      <>
        You fill <b>{k}</b> ordered {theme.place} from <b>{n}</b> {theme.pool}.
      </>
    );
    body = <DescendingProduct {...base} />;
  } else {
    prompt = (
      <>
        You have <b>{n}</b> {theme.pool}. How many ways can you fill <b>{k}</b>{" "}
        ordered {theme.place}?
      </>
    );
    body = <CrossOut {...base} />;
  }

  return (
    <QuestionShell tag="Order matters · no reuse" prompt={prompt}>
      {body}
    </QuestionShell>
  );
}

export const spec: QuizQuestionSpec = {
  id: "permutation",
  lessonId: "l2-perm-no-rep",
  generate,
  Component: PermutationQuestion,
};

export default PermutationQuestion;
