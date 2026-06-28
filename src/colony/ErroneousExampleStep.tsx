import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import {
  buildErroneousExample,
  isCritiqueAiEnabled,
  judgeExplanation,
  miniLessonFor,
  type ErroneousExample,
  type MiniLesson,
  type MissedQuestion,
} from "./critique";

type Stage =
  | "loading" // fetching the rookie ant's wrong solution
  | "solve" // learner clicks the slipped step + types why
  | "judging" // AI is grading the explanation
  | "done"; // verdict / reveal

const num = (v: unknown): number => Number(v);

/** Render the ant's Markdown on a single line (steps sit inline). */
const INLINE_MD: Components = {
  p: ({ children }) => <span>{children}</span>,
};

function Inline({ children }: { children: string }) {
  return <ReactMarkdown components={INLINE_MD}>{children}</ReactMarkdown>;
}

/* ------------------------------ concept visual ------------------------------ */

const CHIP =
  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold";
const LETTERS = "ABCDEFGHIJ";

/**
 * A small, parametrized visual of the scenario so the wrong solution reads as a
 * concrete picture, not just text. Driven entirely by the missed question's
 * params (n/k/items/bins), with a tasteful per-template rendering.
 */
function ConceptVisual({ q }: { q: MissedQuestion }) {
  const p = q.params;
  switch (q.templateId) {
    case "permutation":
    case "combination": {
      const n = Math.min(num(p.n), 10);
      const k = num(p.k);
      return (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: n }).map((_, i) => (
            <span
              key={i}
              className={`${CHIP} ${
                i < k
                  ? "bg-amber-500 text-white ring-2 ring-amber-300"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {LETTERS[i] ?? "?"}
            </span>
          ))}
          <span className="ml-1 text-xs font-semibold text-stone-400">
            pick {k} of {num(p.n)}
          </span>
        </div>
      );
    }
    case "sequence": {
      const n = num(p.n);
      const k = num(p.k);
      return (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: k }).map((_, i) => (
            <span
              key={i}
              className="flex h-8 min-w-[2.75rem] items-center justify-center rounded-lg border-2 border-dashed border-amber-300 px-2 text-xs font-bold text-amber-600"
            >
              1–{n}
            </span>
          ))}
          <span className="ml-1 text-xs font-semibold text-stone-400">
            {k} slots, repeats ok
          </span>
        </div>
      );
    }
    case "multiset": {
      const k = num(p.k);
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.from({ length: Math.min(k, 8) }).map((_, i) => (
            <span key={i} className="text-2xl" aria-hidden>
              🍨
            </span>
          ))}
          <span className="ml-1 text-xs font-semibold text-stone-400">
            {k} scoops from {num(p.n)} flavors (repeats ok)
          </span>
        </div>
      );
    }
    case "distribute": {
      const items = num(p.items);
      const bins = num(p.bins);
      return (
        <div className="flex flex-wrap items-center gap-3">
          {Array.from({ length: Math.min(bins, 5) }).map((_, b) => (
            <span
              key={b}
              className="flex items-center gap-0.5 rounded-lg bg-stone-100 px-2 py-1 text-lg"
              aria-hidden
            >
              📦
            </span>
          ))}
          <span className="ml-1 text-xs font-semibold text-stone-400">
            {items} identical items → {bins} bins
          </span>
        </div>
      );
    }
    case "classify": {
      return (
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
            Does order matter?
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
            Can items repeat?
          </span>
        </div>
      );
    }
    default:
      return null;
  }
}

/* -------------------------------- the step --------------------------------- */

/**
 * "Spot the Slip": a rookie ant shows a step-by-step solution to a problem of
 * the type the learner missed, with exactly one slipped step. The learner CLICKS
 * the step they think is wrong and types WHY. The click is auto-graded against
 * the known wrong step; Andi judges the written reason (or, without a local AI
 * key, a correct click is accepted and the canonical fix is shown). A wrong pick
 * or weak reason surfaces a short reactive mini-lesson.
 */
export default function ErroneousExampleStep({
  missed,
  onDone,
}: {
  missed: MissedQuestion;
  onDone: () => void;
}) {
  const aiOn = useMemo(() => isCritiqueAiEnabled(), []);
  const [stage, setStage] = useState<Stage>("loading");
  const [example, setExample] = useState<ErroneousExample | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [satisfactory, setSatisfactory] = useState(false);
  const [mini, setMini] = useState<MiniLesson | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildErroneousExample(missed).then((ex) => {
      if (cancelled) return;
      setExample(ex);
      setStage("solve");
    });
    return () => {
      cancelled = true;
    };
  }, [missed]);

  async function submit() {
    if (!example || selectedStep === null || text.trim().length === 0) return;
    const pickCorrect = selectedStep === example.wrongStepIndex;

    // Wrong step: don't bother the judge — reveal the true slip + a short fix.
    if (!pickCorrect) {
      setStage("judging");
      const m = await miniLessonFor(example, text);
      setMini(m);
      setSatisfactory(false);
      setFeedback("That wasn't the slipped step — here's where it actually goes wrong.");
      setStage("done");
      return;
    }

    // Right step, no AI: accept the catch and show the canonical fix.
    if (!aiOn) {
      setSatisfactory(true);
      setFeedback("");
      setStage("done");
      return;
    }

    // Right step + AI: judge the written reason.
    setStage("judging");
    const verdict = await judgeExplanation(example, text, true);
    setFeedback(verdict.feedback);
    setSatisfactory(verdict.satisfactory);
    if (!verdict.satisfactory) {
      const m = await miniLessonFor(example, text);
      setMini(m);
    }
    setStage("done");
  }

  const canSubmit =
    stage === "solve" && selectedStep !== null && text.trim().length > 0;

  // Reveal the true slipped step (and the learner's pick) once they've attempted.
  const reveal = stage === "done";

  return (
    <>
      <main className="flex-1 overflow-y-auto px-5 py-5">
        {stage === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
            <p className="mt-4 text-sm font-semibold text-stone-500">
              A rookie ant is working out a problem…
            </p>
          </div>
        )}

        {example && stage !== "loading" && (
          <>
            {/* The rookie ant's wrong solution: the thing to critique. */}
            <div className="rounded-2xl border-2 border-rose-100 bg-rose-50/60 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-500">
                <span aria-hidden>🐜</span> A rookie ant tried this
              </p>
              <div className="mt-2 text-[15px] font-semibold text-stone-700">
                <Inline>{example.setup}</Inline>
              </div>

              <div className="mt-3">
                <ConceptVisual q={missed} />
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-400">
                {reveal ? "The ant's working" : "Tap the step you think is wrong"}
              </p>
              <ol className="mt-2 space-y-2">
                {example.steps.map((s, i) => {
                  const isSlip = i === example.wrongStepIndex;
                  const isPick = i === selectedStep;
                  const flagged = reveal && isSlip;
                  const wrongPick = reveal && isPick && !isSlip;
                  const selectedNow = !reveal && isPick;

                  const cls = flagged
                    ? "border-rose-300 bg-rose-100 text-rose-800"
                    : wrongPick
                      ? "border-stone-300 bg-stone-100 text-stone-500"
                      : selectedNow
                        ? "border-amber-400 bg-amber-50 text-stone-800 ring-2 ring-amber-200"
                        : "border-stone-200 bg-white text-stone-700 hover:border-amber-300";

                  return (
                    <li key={i}>
                      <button
                        type="button"
                        disabled={stage !== "solve"}
                        onClick={() => setSelectedStep(i)}
                        className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition disabled:cursor-default ${cls}`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold ${
                            flagged
                              ? "bg-rose-500 text-white"
                              : selectedNow
                                ? "bg-amber-500 text-white"
                                : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="flex-1 leading-relaxed">
                          <Inline>{s}</Inline>
                          {flagged && (
                            <span className="ml-1 text-xs font-bold uppercase text-rose-500">
                              ← the slip
                            </span>
                          )}
                          {wrongPick && (
                            <span className="ml-1 text-xs font-bold uppercase text-stone-400">
                              ← your pick
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-3 text-sm font-semibold text-stone-500">
                The ant's answer:{" "}
                <span className="rounded-md bg-rose-100 px-2 py-0.5 font-extrabold text-rose-600 line-through">
                  {example.wrongAnswer}
                </span>
              </p>
            </div>

            {/* Explain-why box while solving / judging. */}
            {(stage === "solve" || stage === "judging") && (
              <div className="mt-5">
                <label
                  htmlFor="critique-text"
                  className="text-sm font-bold text-stone-700"
                >
                  You're the teacher — why is that step wrong?
                </label>
                <textarea
                  id="critique-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={stage === "judging"}
                  rows={4}
                  placeholder="Explain the mistake in your own words…"
                  className="mt-2 w-full resize-none rounded-xl border border-stone-200 px-3 py-2 text-[15px] text-stone-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
                />
                {stage === "judging" && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-stone-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
                    Andi is checking your answer…
                  </p>
                )}
              </div>
            )}

            {/* Verdict. */}
            {reveal && satisfactory && (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
                <div className="text-4xl">🔎</div>
                <h3 className="mt-2 text-lg font-extrabold text-emerald-700">
                  Nice catch!
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  {feedback || "You spotted exactly what the ant got wrong."}
                </p>
                <div className="mt-3 text-[15px] leading-relaxed text-stone-700">
                  <Inline>{example.canonicalExplanation}</Inline>
                </div>
                <p className="mt-2 text-sm font-semibold text-stone-500">
                  Correct answer: {example.correctAnswer}
                </p>
              </div>
            )}

            {reveal && !satisfactory && (
              <div className="mt-5 space-y-3">
                {feedback && (
                  <p className="text-sm font-medium text-stone-500">{feedback}</p>
                )}
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    The slip
                  </p>
                  <p className="mt-1 font-semibold text-stone-800">
                    {mini ? mini.point : example.misconception}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-700">
                    The fix
                  </p>
                  <div className="mt-1 text-[15px] leading-relaxed text-stone-700">
                    <Inline>{mini ? mini.fix : example.canonicalExplanation}</Inline>
                  </div>
                  {mini && (
                    <p className="mt-3 text-sm font-semibold text-emerald-700">
                      Try this: {mini.tryThis}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-stone-500">
                    Correct answer: {example.correctAnswer}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-stone-100 px-5 py-4">
        {(stage === "solve" || stage === "judging") && (
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {selectedStep === null ? "Pick the wrong step first" : "Submit"}
          </button>
        )}

        {reveal && (
          <button
            onClick={onDone}
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]"
          >
            Done
          </button>
        )}
      </footer>
    </>
  );
}
