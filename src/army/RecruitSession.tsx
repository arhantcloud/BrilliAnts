import { useCallback, useRef, useState } from "react";
import { getTemplate } from "../quiz/registry";
import { createRng } from "../quiz/rng";
import { useProgress } from "../progress/progress-context";
import type { GeneratedQuestion } from "../types";
import { recruitTemplateId } from "./config";
import { RankBadge } from "./rankVisuals";

type Phase = "asking" | "success" | "fail";

/**
 * The one-question recruit challenge for button topics (l3/l5/l6, which have no
 * standalone quiz). A correct answer adds one worker ant to the anthill (up to
 * its cap); a wrong answer recruits no one and offers a fresh question.
 */
export default function RecruitSession({
  topicId,
  topicLabel,
  onClose,
}: {
  topicId: string;
  topicLabel: string;
  onClose: () => void;
}) {
  const { recruitAnt } = useProgress();
  const recruited = useRef(false);

  const templateId = recruitTemplateId(topicId);
  const spec = templateId ? getTemplate(templateId) : undefined;

  const [question, setQuestion] = useState<GeneratedQuestion | undefined>(() =>
    spec ? spec.generate(createRng()) : undefined,
  );
  const [result, setResult] = useState<boolean | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("asking");

  const handleResult = useCallback((correct: boolean) => {
    setResult((prev) => (prev === undefined ? correct : prev));
  }, []);

  function finish() {
    if (result === undefined) return;
    if (result) {
      if (!recruited.current) {
        recruited.current = true;
        recruitAnt(topicId);
      }
      setPhase("success");
    } else {
      setPhase("fail");
    }
  }

  function retry() {
    if (!spec) return;
    setQuestion(spec.generate(createRng()));
    setResult(undefined);
    setPhase("asking");
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/55 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-umber-600">
              <span aria-hidden>🐜</span> Recruit a worker
            </p>
            <p className="text-sm font-bold text-stone-700">{topicLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close recruit"
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
            <main className="flex-1 overflow-y-auto px-5 py-5">
              {spec && question ? (
                <spec.Component
                  question={question}
                  locked={result !== undefined}
                  onResult={handleResult}
                />
              ) : (
                <p className="text-stone-500">
                  This recruit question could not be loaded.
                </p>
              )}
            </main>
            <footer className="border-t border-stone-100 px-5 py-4">
              <button
                onClick={finish}
                disabled={result === undefined}
                className="inline-flex w-full items-center justify-center rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                Finish
              </button>
            </footer>
          </>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="animate-pop-in">
              <RankBadge rank={0} size={56} />
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-emerald-700">
              Worker recruited!
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              A new worker joins your {topicLabel} anthill.
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
            <div className="text-5xl">🐜</div>
            <h2 className="mt-3 text-xl font-extrabold text-amber-700">
              No recruit this time
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Answer correctly to bring a worker into the colony.
            </p>
            <div className="mt-8 w-full max-w-xs space-y-3">
              <button
                onClick={retry}
                className="w-full rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98]"
              >
                Try another question
              </button>
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
