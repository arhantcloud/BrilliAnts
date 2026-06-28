import { useState, type ReactNode } from "react";
import {
  Feedback,
  FormulaFill,
  QuestionShell,
  type FormulaField,
} from "../shared";
import type { AntStop } from "../../../mascot/mascot-context";
import type { Rng } from "../../rng";

/**
 * Shared answer drivers for the Ant Army upgrade challenges. Numeric answers are
 * entered by typing into a C()/P()/equation template (the Brilli-compatible
 * {@link FormulaFill}); the only non-numeric formats are the tap-to-pick option
 * cards and the multi-row quadrant sort used by the L1 classification topic.
 */

/* ------------------------- fill-the-formula wrappers ------------------------ */

/** A small helper to author one Brilli explanation box. */
export function box(id: string, title: string, text: string): AntStop {
  return { id, title, text };
}

/**
 * A number-entry upgrade question: the prompt sits in a {@link QuestionShell}
 * and the answer is typed into a C()/P()/equation template rendered by
 * `layout`. Wrong blanks are walked by Brilli the ant after submit.
 */
export function FormulaUpgrade({
  tag,
  prompt,
  fields,
  answer,
  unit,
  boxes,
  layout,
  locked,
  onResult,
}: {
  tag: ReactNode;
  prompt: ReactNode;
  fields: FormulaField[];
  answer: number;
  unit: string;
  boxes: Record<string, AntStop>;
  layout: (field: (key: string) => ReactNode) => ReactNode;
  locked: boolean;
  onResult: (correct: boolean) => void;
}) {
  return (
    <QuestionShell tag={tag} prompt={prompt}>
      <FormulaFill
        fields={fields}
        answer={answer}
        unit={unit}
        boxes={boxes}
        layout={layout}
        locked={locked}
        onResult={onResult}
      />
    </QuestionShell>
  );
}

/** A labelled blank stacked under the formula expression it computes. */
function LabelledBlank({
  expr,
  children,
}: {
  expr: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-stone-400">{expr}</span>
      {children}
    </span>
  );
}

/**
 * Complement-counting upgrade question shaped as an equation:
 * `total − removed = answer`. The learner computes each count and types it into
 * the template. Reusable across the L3–L6 "at least / at most / capped" general
 * challenges.
 */
export function SubtractUpgrade({
  tag,
  prompt,
  unit,
  total,
  removed,
  totalExpr,
  removedExpr,
  totalText,
  removedText,
  removedTitle,
  locked,
  onResult,
}: {
  tag: ReactNode;
  prompt: ReactNode;
  unit: string;
  /** The unrestricted count (e.g. all selections). */
  total: number;
  /** The count to subtract off (e.g. the forbidden selections). */
  removed: number;
  /** Notation shown above the total blank, e.g. "C(8, 3)". */
  totalExpr: ReactNode;
  /** Notation shown above the removed blank. */
  removedExpr: ReactNode;
  totalText: string;
  removedText: string;
  removedTitle: string;
  locked: boolean;
  onResult: (correct: boolean) => void;
}) {
  const answer = total - removed;
  const fields: FormulaField[] = [
    { key: "tot", label: "all ways", expected: total, boxId: "sub-tot" },
    { key: "rem", label: removedTitle, expected: removed, boxId: "sub-rem" },
    { key: "res", label: "answer", expected: answer, boxId: "sub-res", width: "w-20" },
  ];
  const boxes: Record<string, AntStop> = {
    tot: box("sub-tot", "All ways", totalText),
    rem: box("sub-rem", removedTitle, removedText),
    res: box(
      "sub-res",
      "Subtract",
      `${total.toLocaleString()} − ${removed.toLocaleString()} = ${answer.toLocaleString()}.`,
    ),
  };
  return (
    <FormulaUpgrade
      tag={tag}
      prompt={prompt}
      fields={fields}
      answer={answer}
      unit={unit}
      boxes={boxes}
      locked={locked}
      onResult={onResult}
      layout={(field) => (
        <div className="mt-5 flex flex-wrap items-end justify-center gap-3 text-2xl font-extrabold text-stone-700">
          <LabelledBlank expr={totalExpr}>{field("tot")}</LabelledBlank>
          <span className="pb-2">−</span>
          <LabelledBlank expr={removedExpr}>{field("rem")}</LabelledBlank>
          <span className="pb-2">=</span>
          <span className="pb-2">{field("res")}</span>
        </div>
      )}
    />
  );
}

/* --------------------------- multiple-choice cards -------------------------- */

export type ChoiceOption = {
  /** Display label (shown on the card and revealed in feedback). */
  label: string;
  /** Optional secondary line under the label. */
  hint?: string;
};

/**
 * Pick exactly one option card, then Submit. Single-attempt: on submit it locks,
 * highlights right/wrong, calls onResult(correct) once, and reveals the answer.
 */
export function MultiChoice({
  tag,
  prompt,
  options,
  correctIndex,
  locked,
  onResult,
}: {
  tag: ReactNode;
  prompt: ReactNode;
  options: ChoiceOption[];
  correctIndex: number;
  locked: boolean;
  onResult: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isLocked = locked || submitted;
  const correct = submitted && selected === correctIndex;

  function submit() {
    if (isLocked || selected === null) return;
    setSubmitted(true);
    onResult(selected === correctIndex);
  }

  function cardCls(i: number): string {
    if (!submitted) {
      return selected === i
        ? "border-umber-500 bg-umber-50 ring-2 ring-umber-300"
        : "border-umber-200 bg-white hover:border-umber-400";
    }
    if (i === correctIndex) return "border-emerald-400 bg-emerald-50";
    if (i === selected) return "border-red-400 bg-red-50";
    return "border-stone-200 bg-white opacity-70";
  }

  return (
    <QuestionShell tag={tag} prompt={prompt}>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            aria-label={opt.label}
            aria-pressed={selected === i}
            disabled={isLocked}
            onClick={() => setSelected(i)}
            className={`min-h-[44px] rounded-xl border-2 px-4 py-3 text-left transition disabled:cursor-default ${cardCls(i)}`}
          >
            <span className="block text-base font-bold tabular-nums text-stone-800">
              {opt.label}
            </span>
            {opt.hint && (
              <span className="mt-0.5 block text-xs text-stone-500">
                {opt.hint}
              </span>
            )}
          </button>
        ))}
      </div>

      {submitted ? (
        <Feedback correct={correct} answer={options[correctIndex].label} />
      ) : (
        <button
          onClick={submit}
          disabled={selected === null}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          Submit
        </button>
      )}
    </QuestionShell>
  );
}

/* ------------------------------- quadrant sort ------------------------------ */

export type SortCell = { key: string; label: string };

/**
 * Assign each of several scenarios to one of the four counting worlds, all at
 * once. Submit grades every row together: one wrong assignment fails the whole
 * question. A genuinely harder classify task - several structures held in mind
 * with no order/repeat toggles to lean on.
 */
export function QuadSort({
  tag,
  prompt,
  scenarios,
  cells,
  answers,
  locked,
  onResult,
}: {
  tag: ReactNode;
  prompt: ReactNode;
  scenarios: string[];
  cells: SortCell[];
  /** Correct cell key per scenario (same order as `scenarios`). */
  answers: string[];
  locked: boolean;
  onResult: (correct: boolean) => void;
}) {
  const [picks, setPicks] = useState<(string | null)[]>(() =>
    scenarios.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  const isLocked = locked || submitted;

  const ready = picks.every((p) => p !== null);
  const allCorrect = picks.every((p, i) => p === answers[i]);
  const correct = submitted && allCorrect;

  function choose(row: number, key: string) {
    if (isLocked) return;
    setPicks((prev) => {
      const next = prev.slice();
      next[row] = key;
      return next;
    });
  }

  function submit() {
    if (isLocked || !ready) return;
    setSubmitted(true);
    onResult(allCorrect);
  }

  function cellCls(row: number, key: string): string {
    const picked = picks[row] === key;
    if (!submitted) {
      return picked
        ? "border-umber-500 bg-umber-100 text-umber-800"
        : "border-umber-200 bg-white text-stone-600 hover:border-umber-400";
    }
    if (key === answers[row]) return "border-emerald-400 bg-emerald-50 text-emerald-700";
    if (picked) return "border-red-400 bg-red-50 text-red-600";
    return "border-stone-200 bg-white text-stone-400";
  }

  return (
    <QuestionShell tag={tag} prompt={prompt}>
      <div className="mt-4 space-y-3">
        {scenarios.map((text, row) => (
          <div
            key={row}
            className="rounded-2xl border-2 border-umber-100 bg-umber-50/40 p-3"
          >
            <p className="text-[13px] font-semibold leading-snug text-stone-700">
              {text}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {cells.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  aria-label={`Scenario ${row + 1}: ${cell.label}`}
                  aria-pressed={picks[row] === cell.key}
                  disabled={isLocked}
                  onClick={() => choose(row, cell.key)}
                  className={`min-h-[40px] rounded-lg border-2 px-2 py-1.5 text-xs font-bold transition disabled:cursor-default ${cellCls(row, cell.key)}`}
                >
                  {cell.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {submitted ? (
        <Feedback
          correct={correct}
          answer={
            allCorrect
              ? "all sorted correctly"
              : "check the highlighted rows"
          }
        />
      ) : (
        <button
          onClick={submit}
          disabled={!ready}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          Submit
        </button>
      )}
    </QuestionShell>
  );
}

/* --------------------------- stars-and-bars visual -------------------------- */

/**
 * A small static stars-and-bars illustration shown above the answer template for
 * the multiset / distribute upgrade questions: `stars` dots split by `bars`
 * dividers. Purely decorative; it makes the spatial structure concrete without
 * leaking the count.
 */
export function StarsAndBars({
  stars,
  bars,
  starColor = "#c79a2b",
  barColor = "#4e342b",
}: {
  stars: number;
  bars: number;
  starColor?: string;
  barColor?: string;
}) {
  const items: ReactNode[] = [];
  for (let i = 0; i < stars; i++) {
    items.push(
      <span
        key={`s${i}`}
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: starColor }}
        aria-hidden
      />,
    );
  }
  for (let i = 0; i < bars; i++) {
    items.push(
      <span
        key={`b${i}`}
        className="inline-block h-4 w-[3px] rounded-full"
        style={{ backgroundColor: barColor }}
        aria-hidden
      />,
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2">
      {items}
    </div>
  );
}

/* ------------------------------- option builder ----------------------------- */

/** Fisher-Yates shuffle driven by the seeded rng (deterministic per attempt). */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build four distinct, positive multiple-choice values around `correct`, drawing
 * from `distractors` first and padding with nearby integers if needed, then
 * shuffle them. Returns the shuffled values and the index of the correct one.
 */
export function buildNumericChoices(
  rng: Rng,
  correct: number,
  distractors: number[],
): { values: number[]; correctIndex: number } {
  const set = new Set<number>([correct]);
  for (const d of distractors) {
    if (set.size >= 4) break;
    if (Number.isInteger(d) && d > 0) set.add(d);
  }
  let bump = 1;
  while (set.size < 4) {
    const up = correct + bump;
    if (up > 0 && !set.has(up)) set.add(up);
    if (set.size < 4) {
      const down = correct - bump;
      if (down > 0 && !set.has(down)) set.add(down);
    }
    bump++;
  }
  const values = shuffle(rng, [...set]);
  return { values, correctIndex: values.indexOf(correct) };
}
