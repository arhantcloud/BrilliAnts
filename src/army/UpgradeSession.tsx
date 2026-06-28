import { useCallback, useRef, useState } from "react";
import { getUpgradeTemplate } from "../quiz/templates/upgrades/registry";
import { createRng } from "../quiz/rng";
import { useProgress } from "../progress/progress-context";
import type { ArmyAnt, GeneratedQuestion } from "../types";
import { upgradeTemplateId } from "./config";
import { attemptsLeft } from "./antState";
import { RankBadge, rankLabel } from "./rankVisuals";

const UPGRADE_COUNT = 2;

/** Full fingerprint of a question so the two challenges differ. */
function signature(q: GeneratedQuestion): string {
  return JSON.stringify(q.params) + "#" + String(q.answer);
}

/** Two distinct questions from the rank-appropriate upgrade template. */
function makeQuestions(templateId: string | null): GeneratedQuestion[] {
  if (!templateId) return [];
  const spec = getUpgradeTemplate(templateId);
  if (!spec) return [];
  const rng = createRng();
  const out: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < UPGRADE_COUNT && guard < 200) {
    guard++;
    const q = spec.generate(rng);
    const sig = signature(q);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(q);
  }
  return out;
}

type Phase = "asking" | "success" | "fail";

/**
 * The two-question challenge to promote one army ant. Both must be answered
 * correctly to upgrade; any miss spends one of the day's two attempts (handled by
 * attemptAntUpgrade, which re-checks eligibility). Adapts the colony's
 * ReviewSession to the harder, rank-appropriate upgrade templates.
 */
export default function UpgradeSession({
  topicId,
  ant,
  topicLabel,
  onClose,
}: {
  topicId: string;
  ant: ArmyAnt;
  topicLabel: string;
  onClose: () => void;
}) {
  const { attemptAntUpgrade } = useProgress();
  const resolved = useRef(false);

  // Freeze the rank we are upgrading FROM at open time, so a mid-session promotion
  // (which updates the live `ant`) never swaps the template or the target label.
  const [startRank] = useState<ArmyAnt["rank"]>(() => ant.rank);
  const templateId = upgradeTemplateId(topicId, startRank);
  const spec = templateId ? getUpgradeTemplate(templateId) : undefined;
  const targetRank = (startRank + 1) as ArmyAnt["rank"];

  const [questions, setQuestions] = useState<GeneratedQuestion[]>(() =>
    makeQuestions(templateId),
  );
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(boolean | undefined)[]>(() =>
    Array(UPGRADE_COUNT).fill(undefined),
  );
  const [phase, setPhase] = useState<Phase>("asking");

  const question = questions[step];
  const answered = results[step] !== undefined;
  const isLast = step === UPGRADE_COUNT - 1;

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

  function finish(finalResults: (boolean | undefined)[]) {
    if (resolved.current) return;
    resolved.current = true;
    const bothCorrect = finalResults.every((r) => r === true);
    attemptAntUpgrade(topicId, ant.id, bothCorrect);
    setPhase(bothCorrect ? "success" : "fail");
  }

  function advance() {
    if (!answered) return;
    if (isLast) {
      finish(results);
    } else {
      setStep((s) => s + 1);
    }
  }

  function retry() {
    if (attemptsLeft(ant) <= 0) {
      onClose();
      return;
    }
    resolved.current = false;
    setQuestions(makeQuestions(templateId));
    setResults(Array(UPGRADE_COUNT).fill(undefined));
    setStep(0);
    setPhase("asking");
  }

  const remaining = attemptsLeft(ant);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/55 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-umber-600">
              <span aria-hidden>⚔️</span> Promote to {rankLabel(targetRank)}
            </p>
            <p className="text-sm font-bold text-stone-700">{topicLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close upgrade"
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
                {Array.from({ length: UPGRADE_COUNT }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      results[i] === true
                        ? "bg-emerald-400"
                        : results[i] === false
                          ? "bg-rose-400"
                          : i === step
                            ? "bg-umber-500"
                            : "bg-stone-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-stone-400">
                Question {step + 1} of {UPGRADE_COUNT} · both must be correct ·{" "}
                {remaining} attempt{remaining === 1 ? "" : "s"} left today
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
                  This upgrade challenge could not be loaded.
                </p>
              )}
            </main>

            <footer className="border-t border-stone-100 px-5 py-4">
              <button
                onClick={advance}
                disabled={!answered}
                className="inline-flex w-full items-center justify-center rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isLast ? "Finish" : "Next"}
              </button>
            </footer>
          </>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="animate-pop-in">
              <RankBadge rank={targetRank} size={64} />
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-emerald-700">
              Promoted to {rankLabel(targetRank)}!
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              This ant grows stronger. It can be promoted again tomorrow.
            </p>
            <button
              onClick={onClose}
              className="mt-8 w-full max-w-xs rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              Back to the base →
            </button>
          </div>
        )}

        {phase === "fail" && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="text-5xl">🛡️</div>
            <h2 className="mt-3 text-xl font-extrabold text-amber-700">
              Not promoted yet
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Both answers must be correct. You have {remaining} attempt
              {remaining === 1 ? "" : "s"} left today.
            </p>
            <div className="mt-8 w-full max-w-xs space-y-3">
              {remaining > 0 && (
                <button
                  onClick={retry}
                  className="w-full rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98]"
                >
                  Try again ({remaining} left)
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-stone-100 px-4 py-3 font-semibold text-stone-600 transition hover:bg-stone-200"
              >
                Back to the base
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
