import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { course } from "../content/course";
import { getLessonQuiz } from "../content/quizzes";
import { useProgress } from "../progress/progress-context";
import CustomSlideView from "../components/slides/CustomSlideView";

export default function LessonPlayer() {
  const { lessonId = "" } = useParams();
  const navigate = useNavigate();
  const { resumeIndex, completeSlide, stats, lessonStatus, quizStatus } =
    useProgress();

  const lessonIndex = course.lessons.findIndex((l) => l.id === lessonId);
  const lesson = course.lessons[lessonIndex];

  // Resume from the first incomplete slide; if the lesson was already finished,
  // start at the beginning for review.
  const initialIndex = useMemo(() => {
    if (!lesson) return 0;
    const resume = resumeIndex(lessonId);
    return resume >= lesson.slides.length ? 0 : resume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const [current, setCurrent] = useState(initialIndex);
  const [advanceReady, setAdvanceReady] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleSlideComplete = useCallback(() => setAdvanceReady(true), []);

  if (!lesson) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-slate-500">Lesson not found.</p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Back to course
        </button>
      </div>
    );
  }

  const slide = lesson.slides[current];
  const total = lesson.slides.length;
  const isLast = current === total - 1;
  const nextLesson = course.lessons[lessonIndex + 1];

  function onContinue() {
    completeSlide(lessonId, current, total);
    if (isLast) {
      setFinished(true);
    } else {
      // Reset readiness as we move to the next slide. Doing this here (rather
      // than in an effect keyed on `current`) avoids clobbering the incoming
      // slide's own mount-time onComplete (e.g. explore/review slides), which
      // runs after this parent update.
      setAdvanceReady(false);
      setCurrent((c) => c + 1);
    }
  }

  if (finished) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-2xl font-extrabold">Lesson complete!</h1>
        <p className="mt-1 text-slate-500">{lesson.title}</p>

        <div className="mt-6 flex items-center gap-3">
          <div className="card flex flex-col items-center px-5 py-3">
            <span className="text-2xl font-extrabold text-brand-600">
              {stats.currentStreak}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              day streak 🔥
            </span>
          </div>
          <div className="card flex flex-col items-center px-5 py-3">
            <span className="text-2xl font-extrabold text-emerald-600">
              {stats.lessonsCompletedCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              lessons done
            </span>
          </div>
        </div>

        <div className="mt-8 w-full max-w-xs space-y-3">
          {getLessonQuiz(lessonId) &&
            (() => {
              const quizPassed = quizStatus(lessonId) === "passed";
              return (
                <button
                  onClick={() => navigate(`/quiz/${lessonId}`)}
                  className="btn w-full bg-violet-600 text-white hover:bg-violet-700"
                >
                  {quizPassed ? "Review the quiz" : "Take the quiz"} →
                </button>
              );
            })()}

          {nextLesson ? (
            (() => {
              const nextLocked = lessonStatus(nextLesson.id) === "locked";
              return (
                <>
                  <div
                    className={`rounded-2xl p-4 text-left ring-1 ${
                      nextLocked
                        ? "bg-slate-50 ring-slate-100"
                        : "bg-brand-50 ring-brand-100"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        nextLocked ? "text-slate-400" : "text-brand-400"
                      }`}
                    >
                      {nextLocked ? "Locked next" : "Recommended next"}
                    </p>
                    <p
                      className={`mt-1 font-bold ${
                        nextLocked ? "text-slate-600" : "text-brand-900"
                      }`}
                    >
                      {nextLesson.title}
                    </p>
                    <p
                      className={`text-sm ${
                        nextLocked ? "text-slate-500" : "text-brand-700"
                      }`}
                    >
                      {nextLocked
                        ? "Pass the quiz above to unlock this lesson."
                        : nextLesson.summary}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                    disabled={nextLocked}
                    className="btn-ghost w-full"
                  >
                    Start next lesson →
                  </button>
                </>
              );
            })()
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <p className="font-bold text-emerald-800">
                You completed the whole course! 🏆
              </p>
            </div>
          )}
          <button onClick={() => navigate("/")} className="btn-ghost w-full">
            Back to course path
          </button>
        </div>
      </div>
    );
  }

  const progressPct = Math.round(((current + (advanceReady ? 1 : 0)) / total) * 100);

  return (
    <div className="flex h-full flex-col">
      <header className="px-4 pb-3 pt-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <button
          onClick={() => navigate("/")}
          aria-label="Exit lesson"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
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
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="w-12 text-right text-xs font-bold text-slate-400">
          {current + 1}/{total}
        </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 sm:px-8 sm:py-6">
        <div className="mx-auto w-full max-w-xl">
        <CustomSlideView
          key={slide.id}
          slide={slide}
          onComplete={handleSlideComplete}
        />
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto w-full max-w-xl">
        <button
          onClick={onContinue}
          disabled={!advanceReady}
          className="btn-primary w-full"
        >
          {isLast ? "Finish lesson" : "Continue"}
        </button>
        </div>
      </footer>
    </div>
  );
}
