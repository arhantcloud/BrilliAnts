import { useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from "react";
import type { QuizQuestionViewProps } from "../QuizQuestionSpec";

/**
 * Shared presentation for quiz question views. The quiz accent is violet/indigo
 * (vs. the brand-blue lesson player) so quizzes feel like a distinct mode.
 */

/** Small uppercase pill labeling the lesson/skill being tested. */
export function QuizTag({ children }: { children: ReactNode }) {
  return (
    <div className="inline-block rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-violet-700">
      {children}
    </div>
  );
}

/** Outer wrapper: tag + prompt copy, then the interactive body. */
export function QuestionShell({
  tag,
  prompt,
  children,
}: {
  tag: ReactNode;
  prompt: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-in-up">
      <QuizTag>{tag}</QuizTag>
      <div className="mt-3 text-[15px] leading-relaxed text-slate-700">
        {prompt}
      </div>
      {children}
    </div>
  );
}

/**
 * Number of digit wheels in {@link DialAnswer}. Three covers every numeric
 * template: the largest answer any generate() can produce is 512 (powers,
 * 8^3), and permutations/combinations/stars-&-bars all stay below 999. Using a
 * fixed width (with leading zeros allowed) means the wheel count never reveals
 * how many digits the real answer has.
 */
const DIAL_DIGITS = 3;

/** Place-value labels, left-to-right, for accessible wheel names. */
const PLACE_LABELS = Array.from({ length: DIAL_DIGITS }, (_, i) => {
  const fromRight = DIAL_DIGITS - 1 - i;
  return (
    ["ones", "tens", "hundreds", "thousands", "ten-thousands"][fromRight] ??
    `place ${fromRight}`
  );
});

/** Pixels of vertical drag that advance a wheel by one digit. */
const DRAG_STEP_PX = 22;

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={up ? "6 15 12 9 18 15" : "6 9 12 15 18 9"} />
    </svg>
  );
}

/**
 * One spinnable 0–9 digit wheel. Driven by up/down chevrons, mouse-wheel
 * scroll, and vertical drag — there is no text entry. `onSpin(+1 | -1)` asks
 * the parent to advance/retreat the digit (the parent handles 0↔9 wrap).
 */
function DigitWheel({
  digit,
  label,
  disabled,
  state,
  onSpin,
}: {
  digit: number;
  label: string;
  disabled: boolean;
  state: "idle" | "correct" | "wrong";
  onSpin: (delta: number) => void;
}) {
  const dragging = useRef(false);
  const lastY = useRef(0);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    dragging.current = true;
    lastY.current = e.clientY;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dy = lastY.current - e.clientY;
    const steps = Math.trunc(dy / DRAG_STEP_PX);
    if (steps !== 0) {
      for (let i = 0; i < Math.abs(steps); i++) onSpin(steps > 0 ? 1 : -1);
      lastY.current -= steps * DRAG_STEP_PX;
    }
  }

  function endDrag(e: PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function onWheelScroll(e: WheelEvent<HTMLDivElement>) {
    if (disabled) return;
    onSpin(e.deltaY < 0 ? 1 : -1);
  }

  const valueCls =
    state === "correct"
      ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
      : state === "wrong"
        ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
        : "bg-white/10 text-violet-100 ring-2 ring-white/20";

  const chevronCls =
    "flex h-7 w-10 items-center justify-center rounded-lg text-violet-200 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        aria-label={`Increase ${label} digit`}
        onClick={() => onSpin(1)}
        disabled={disabled}
        className={chevronCls}
      >
        <Chevron up />
      </button>
      <div
        role="spinbutton"
        aria-label={`${label} digit`}
        aria-valuemin={0}
        aria-valuemax={9}
        aria-valuenow={digit}
        onWheel={onWheelScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`flex h-14 w-10 touch-none select-none items-center justify-center rounded-lg text-3xl font-extrabold tabular-nums outline-none transition sm:w-12 ${valueCls} ${
          disabled ? "" : "cursor-ns-resize"
        }`}
      >
        {digit}
      </div>
      <button
        type="button"
        aria-label={`Decrease ${label} digit`}
        onClick={() => onSpin(-1)}
        disabled={disabled}
        className={chevronCls}
      >
        <Chevron up={false} />
      </button>
    </div>
  );
}

/**
 * A reusable "build the whole-number answer" control used by the four numeric
 * templates (permutations, powers, combinations, stars & bars).
 *
 * Instead of typing, the learner spins a row of {@link DigitWheel}s (one per
 * place value). Submit stays disabled until at least one wheel has moved, so
 * the dial never looks pre-filled with the answer. On submit it locks, reveals
 * right/wrong against `question.answer`, calls `onResult(correct)` exactly
 * once, and shows the `Feedback` banner (which reveals the answer when wrong).
 */
export function DialAnswer({
  question,
  locked,
  onResult,
  unit,
  visual,
}: QuizQuestionViewProps & {
  /** Optional noun shown next to the dial (e.g. "ways", "codes"). */
  unit?: string;
  /** Optional visual rendered above the answer field. */
  visual?: ReactNode;
}) {
  const [digits, setDigits] = useState<number[]>(() =>
    Array(DIAL_DIGITS).fill(0),
  );
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const answer = Number(question.answer);
  const value = Number(digits.join(""));
  const isLocked = locked || submitted;
  const correct = submitted && value === answer;

  function spin(index: number, delta: number) {
    if (isLocked) return;
    setTouched(true);
    setDigits((prev) => {
      const next = prev.slice();
      next[index] = (next[index] + delta + 10) % 10;
      return next;
    });
  }

  function submit() {
    if (isLocked || !touched) return;
    setSubmitted(true);
    onResult(value === answer);
  }

  const wheelState: "idle" | "correct" | "wrong" = !submitted
    ? "idle"
    : correct
      ? "correct"
      : "wrong";

  return (
    <div className="mt-5">
      {visual}

      <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-center text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
          Your answer
        </p>
        <div className="mt-3 flex items-end justify-center gap-1.5 sm:gap-2">
          {digits.map((d, i) => (
            <DigitWheel
              key={i}
              digit={d}
              label={PLACE_LABELS[i]}
              disabled={isLocked}
              state={wheelState}
              onSpin={(delta) => spin(i, delta)}
            />
          ))}
          {unit && (
            <span className="ml-1 pb-3 text-sm font-semibold text-slate-400">
              {unit}
            </span>
          )}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Spin each wheel — use the arrows, scroll, or drag.
        </p>
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={!touched}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          Submit
        </button>
      ) : (
        <Feedback correct={correct} answer={answer} unit={unit} />
      )}
    </div>
  );
}

/** Result banner shown after a question is answered. */
export function Feedback({
  correct,
  answer,
  unit,
}: {
  correct: boolean;
  answer: number | string;
  unit?: string;
}) {
  return (
    <div
      className={`mt-4 animate-fade-in rounded-xl px-4 py-3 text-sm ${
        correct
          ? "bg-emerald-50 text-emerald-800"
          : "bg-red-50 text-red-800"
      }`}
    >
      <p className="font-bold">{correct ? "Correct!" : "Not quite"}</p>
      {!correct && (
        <p className="mt-0.5">
          The answer is{" "}
          <b>
            {typeof answer === "number" ? answer.toLocaleString() : answer}
          </b>
          {unit ? ` ${unit}` : ""}.
        </p>
      )}
    </div>
  );
}
