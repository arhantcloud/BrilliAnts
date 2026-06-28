import { useCallback, useRef, useState } from "react";
import { getTemplate } from "../quiz/registry";
import { createRng } from "../quiz/rng";
import { useProgress } from "../progress/progress-context";
import type { GeneratedQuestion, Mistake } from "../types";

const REVIEW_COUNT = 2;

/** Numeric fingerprint of a question so the two practice problems differ. */
function numericSignature(q: GeneratedQuestion): string {
  return Object.keys(q.params)
    .filter((key) => typeof q.params[key] === "number")
    .sort()
    .map((key) => `${key}=${q.params[key]}`)
    .join("&");
}

/** Generate two distinct same-type questions for a mistake's template/style. */
function makeQuestions(mistake: Mistake): GeneratedQuestion[] {
  const spec = getTemplate(mistake.templateId);
  if (!spec) return [];
  const rng = createRng();
  const out: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < REVIEW_COUNT && guard < 200) {
    guard++;
    let q = spec.generate(rng);
    const sig = numericSignature(q);
    if (seen.has(sig)) continue;
    seen.add(sig);
    if (mistake.style !== undefined) {
      q = { ...q, params: { ...q.params, style: mistake.style } };
    }
    out.push(q);
  }
  return out;
}

type Phase = "asking" | "success" | "fail";

/**
 * The 2-question challenge to free one ant. Renders the mistake's template
 * twice in sequence; answering both correctly clears the mistake (recovers a
 * quiz point). Any wrong answer fails the round, and the learner can retry with a
 * fresh pair (the ant stays).
 */
export default function ReviewSession({
  mistake,
  lessonLabel,
  onClose,
  onResolved,
}: {
  mistake: Mistake;
  lessonLabel: string;
  onClose: () => void;
  /** Fired when the modal closes after a successful rescue (drives the
   * "ant climbs out" animation in the colony). */
  onResolved: (mistake: Mistake) => void;
}) {
  const { resolveMistake } = useProgress();
  const resolved = useRef(false);

  // Closing after a win triggers the colony's climb-out animation.
  function close() {
    if (resolved.current) onResolved(mistake);
    onClose();
  }

  const [questions, setQuestions] = useState<GeneratedQuestion[]>(() =>
    makeQuestions(mistake),
  );
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(boolean | undefined)[]>(() =>
    Array(REVIEW_COUNT).fill(undefined),
  );
  const [phase, setPhase] = useState<Phase>("asking");

  const spec = getTemplate(mistake.templateId);
  const question = questions[step];
  const answered = results[step] !== undefined;
  const isLast = step === REVIEW_COUNT - 1;

  const handleResult = useCallback(
    (correct: boolean) => {
      setResults((prev) => {
        if (prev[step] !== undefined) return prev;
        const copy = [...prev];
        copy[step] = correct;
        return copy;
      });
    },
    [step],
  );

  function advance() {
    if (!answered) return;
    if (results[step] === false) {
      setPhase("fail");
      return;
    }
    if (isLast) {
      if (!resolved.current) {
        resolved.current = true;
        resolveMistake(mistake.lessonId, mistake.id);
      }
      setPhase("success");
    } else {
      setStep((s) => s + 1);
    }
  }

  function retry() {
    setQuestions(makeQuestions(mistake));
    setResults(Array(REVIEW_COUNT).fill(undefined));
    setStep(0);
    setPhase("asking");
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
              <span aria-hidden>🐜</span> Free an ant
            </p>
            <p className="text-sm font-bold text-stone-700">{lessonLabel}</p>
          </div>
          <button
            onClick={close}
            aria-label="Close review"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {phase === "asking" && (
          <>
            <div className="border-b border-stone-100 px-5 py-2">
              <div className="flex items-center gap-2">
                {Array.from({ length: REVIEW_COUNT }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      results[i] === true
                        ? "bg-emerald-400"
                        : results[i] === false
                          ? "bg-rose-400"
                          : i === step
                            ? "bg-amber-400"
                            : "bg-stone-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-stone-400">
                Question {step + 1} of {REVIEW_COUNT} · answer both correctly
              </p>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-5">
              {spec && question ? (
                <spec.Component
                  key={step}
                  question={question}
                  locked={answered}
                  onResult={handleResult}
                />
              ) : (
                <p className="text-stone-500">
                  This practice question could not be loaded.
                </p>
              )}
            </main>

            <footer className="border-t border-stone-100 px-5 py-4">
              <button
                onClick={advance}
                disabled={!answered}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isLast ? "Finish" : "Next"}
              </button>
            </footer>
          </>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="mt-3 text-xl font-extrabold text-emerald-700">
              Ant rescued!
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              You won back a quiz point for {lessonLabel}, and this ant now joins
              your Ant Army.
            </p>
            <button
              onClick={close}
              className="mt-8 w-full max-w-xs rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              Watch it leave →
            </button>
          </div>
        )}

        {phase === "fail" && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="text-5xl">💪</div>
            <h2 className="mt-3 text-xl font-extrabold text-amber-700">
              Not quite, the ant stays
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              You need both right to free it. Try a fresh pair of questions.
            </p>
            <div className="mt-8 w-full max-w-xs space-y-3">
              <button
                onClick={retry}
                className="w-full rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-stone-100 px-4 py-3 font-semibold text-stone-600 transition hover:bg-stone-200"
              >
                Back to the colony
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
