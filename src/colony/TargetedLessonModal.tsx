import { useCallback, useEffect, useMemo, useState } from "react";
import CustomSlideView from "../components/slides/CustomSlideView";
import {
  buildNestContext,
  generateTutorLesson,
  isTutorAiEnabled,
  type TutorLesson,
} from "./tutor";
import { resolveMissedQuestion, type MissedQuestion } from "./critique";
import ErroneousExampleStep from "./ErroneousExampleStep";
import type { CustomSlide, Mistake } from "../types";

type Phase = "slides" | "critique";

/** Pick the nest's most-missed problem instance for the "Spot the Slip" step. */
function topMissedQuestion(ants: Mistake[]): MissedQuestion | null {
  if (ants.length === 0) return null;
  const groups = new Map<string, Mistake[]>();
  for (const ant of ants) {
    const key = `${ant.templateId}:${ant.style ?? "-"}`;
    const list = groups.get(key);
    if (list) list.push(ant);
    else groups.set(key, [ant]);
  }
  let best: Mistake[] = [];
  for (const list of groups.values()) {
    if (list.length > best.length) best = list;
  }
  return best.length > 0 ? resolveMissedQuestion(best[0]) : null;
}

/**
 * Per-nest targeted review for one nest. Replays the most relevant lesson slides
 * (AI-selected when a local key is present, authored otherwise), then runs the
 * "Spot the Slip" critique: a rookie ant shows a wrong solution to a problem of
 * the type the learner missed, the learner explains the error, and Andi judges
 * it, with a short reactive mini-lesson if the explanation falls short.
 */
export default function TargetedLessonModal({
  nest,
  onClose,
}: {
  nest: { id: string; label: string; ants: Mistake[] };
  onClose: () => void;
}) {
  const ctx = useMemo(
    () => buildNestContext(nest.id, nest.ants),
    [nest.id, nest.ants],
  );
  const missed = useMemo(() => topMissedQuestion(nest.ants), [nest.ants]);

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<TutorLesson | null>(null);
  const [phase, setPhase] = useState<Phase>("slides");
  const [slideIndex, setSlideIndex] = useState(0);
  const [advanceReady, setAdvanceReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    generateTutorLesson(ctx).then((result) => {
      if (cancelled) return;
      setLesson(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ctx]);

  // Map a recommended component key back to its (optional) title for display.
  const titleFor = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const s of ctx.slideCatalog) m.set(s.component, s.title);
    return m;
  }, [ctx.slideCatalog]);

  const slideComponents = lesson?.recommendedSlides ?? [];
  const hasSlides = slideComponents.length > 0;
  const slide: CustomSlide | null = hasSlides
    ? {
        id: `tutor-${nest.id}-${slideComponents[slideIndex]}-${slideIndex}`,
        type: "custom",
        component: slideComponents[slideIndex],
        title: titleFor.get(slideComponents[slideIndex]),
      }
    : null;
  const isLastSlide = slideIndex === slideComponents.length - 1;

  const handleSlideComplete = useCallback(() => setAdvanceReady(true), []);

  // Once slides are done, move to the critique step if we can build a wrong
  // example; otherwise just close.
  const finishSlides = useCallback(() => {
    if (missed) setPhase("critique");
    else onClose();
  }, [missed, onClose]);

  // Show the critique when the learner advances past the slides, or immediately
  // when this nest has no relevant slides to replay (derived, not an effect).
  const showCritique =
    !loading && lesson != null && missed != null && (phase === "critique" || !hasSlides);

  function nextSlide() {
    if (isLastSlide) {
      finishSlides();
      return;
    }
    setAdvanceReady(false);
    setSlideIndex((i) => i + 1);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
              <span aria-hidden>🐜</span>{" "}
              {showCritique ? "Spot the slip" : "Ask Andi"}
              {isTutorAiEnabled() && (
                <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  AI
                </span>
              )}
            </p>
            <p className="text-sm font-bold text-stone-700">{nest.label}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close lesson"
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

        {loading && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
            <p className="mt-4 text-sm font-semibold text-stone-500">
              Andi is preparing a lesson on what you missed…
            </p>
          </div>
        )}

        {!loading && lesson && !showCritique && phase === "slides" && slide && (
          <>
            <div className="border-b border-stone-100 px-5 py-2">
              <div className="flex items-center gap-2">
                {slideComponents.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      i < slideIndex
                        ? "bg-emerald-400"
                        : i === slideIndex
                          ? "bg-amber-400"
                          : "bg-stone-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-stone-400">
                Slide {slideIndex + 1} of {slideComponents.length} · targeted review
              </p>
            </div>

            <main className="flex-1 overflow-y-auto px-5 py-5">
              <CustomSlideView
                key={slide.id}
                slide={slide}
                onComplete={handleSlideComplete}
              />
            </main>

            <footer className="border-t border-stone-100 px-5 py-4">
              <button
                onClick={nextSlide}
                disabled={!advanceReady}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isLastSlide ? "Spot the slip →" : "Next slide"}
              </button>
            </footer>
          </>
        )}

        {!loading && lesson && !showCritique && !slide && !missed && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-sm text-stone-500">
              No review is available for this nest.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full max-w-xs rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700"
            >
              Close
            </button>
          </div>
        )}

        {showCritique && missed && (
          <ErroneousExampleStep missed={missed} onDone={onClose} />
        )}
      </div>
    </div>
  );
}
