import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { useProgress } from "../progress/progress-context";
import { course } from "../content/course";
import { getLessonQuiz } from "../content/quizzes";
import type { LessonStatus } from "../types";

type QuizStatus = "locked" | "available" | "passed" | "failed";

function StatusBadge({ status }: { status: LessonStatus }) {
  const map: Record<LessonStatus, { label: string; cls: string }> = {
    completed: { label: "Done", cls: "bg-emerald-100 text-emerald-700" },
    in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
    available: { label: "Start", cls: "bg-brand-100 text-brand-700" },
    locked: { label: "Locked", cls: "bg-slate-100 text-slate-400" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

function LessonIcon({ status, n }: { status: LessonStatus; n: number }) {
  if (status === "completed") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (status === "locked") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
      {n}
    </div>
  );
}

function QuizBadge({ status }: { status: QuizStatus }) {
  const map: Record<QuizStatus, { label: string; cls: string }> = {
    passed: { label: "Passed", cls: "bg-emerald-100 text-emerald-700" },
    failed: { label: "Retry", cls: "bg-rose-100 text-rose-700" },
    available: { label: "Take quiz", cls: "bg-violet-100 text-violet-700" },
    locked: { label: "Locked", cls: "bg-slate-100 text-slate-400" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

function QuizIcon({ status }: { status: QuizStatus }) {
  if (status === "locked") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
        </svg>
      </div>
    );
  }
  const tone =
    status === "passed"
      ? "bg-emerald-500"
      : status === "failed"
        ? "bg-rose-500"
        : "bg-violet-500";
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${tone}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 5a2 2 0 012-2h2a2 2 0 012 2v1H9V5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 13l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function CoursePath() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const {
    lessonStatus,
    completedCount,
    totalLessons,
    stats,
    loading,
    quizStatus,
    quizResult,
    quizPointsEarned,
    quizPointsTotal,
  } = useProgress();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading your progress...
      </div>
    );
  }

  const pct = Math.round((completedCount / totalLessons) * 100);
  const quizPct =
    quizPointsTotal > 0
      ? Math.round((quizPointsEarned / quizPointsTotal) * 100)
      : 0;
  const nextLesson = course.lessons.find(
    (l) => lessonStatus(l.id) !== "completed",
  );
  // A completed lesson whose quiz still needs attention takes priority over the
  // next (gated) lesson as the prominent call to action.
  const pendingQuizLesson = course.lessons.find((l) => {
    const qs = quizStatus(l.id);
    return lessonStatus(l.id) === "completed" && (qs === "available" || qs === "failed");
  });
  const nextLessonUnlocked =
    !!nextLesson && lessonStatus(nextLesson.id) !== "locked";

  return (
    <div className="flex h-full flex-col">
      <header className="bg-brand-500 px-5 pb-6 pt-8 text-white sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
              Your course
            </p>
            <h1 className="mt-1 text-xl font-extrabold leading-tight">
              {course.title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">
              <span aria-hidden>🔥</span>
              <span>{stats.currentStreak}</span>
            </div>
            <button
              onClick={() => logOut()}
              className="text-xs font-semibold text-brand-100 underline-offset-2 hover:underline"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-brand-100">
            <span>
              {completedCount} of {totalLessons} lessons
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-violet-100">
            <span className="flex items-center gap-1">
              <span aria-hidden>🎯</span>
              Quiz points · {quizPointsEarned} / {quizPointsTotal}
            </span>
            <span>{quizPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-300 transition-all duration-500"
              style={{ width: `${quizPct}%` }}
            />
          </div>
        </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-5xl">
        {pendingQuizLesson && (
          <button
            onClick={() => navigate(`/quiz/${pendingQuizLesson.id}`)}
            className="mb-5 w-full rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 p-5 text-left text-white shadow-md transition active:scale-[0.99]"
          >
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-violet-100">
              <span aria-hidden>🎯</span>
              {quizStatus(pendingQuizLesson.id) === "failed"
                ? "Retry your quiz"
                : "Quiz unlocked"}
            </p>
            <p className="mt-1 text-lg font-bold">
              {pendingQuizLesson.title} quiz
            </p>
            <p className="mt-0.5 text-sm text-violet-100">
              {quizStatus(pendingQuizLesson.id) === "failed"
                ? "Pass it to unlock the next lesson."
                : "Test what you learned to unlock the next lesson."}
            </p>
            <span className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold text-violet-700">
              Take the quiz →
            </span>
          </button>
        )}

        {!pendingQuizLesson && nextLessonUnlocked && nextLesson && (
          <button
            onClick={() => navigate(`/lesson/${nextLesson.id}`)}
            className="mb-5 w-full rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-left text-white shadow-md transition active:scale-[0.99]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
              {completedCount === 0 ? "Start here" : "Up next"}
            </p>
            <p className="mt-1 text-lg font-bold">{nextLesson.title}</p>
            <p className="mt-0.5 text-sm text-brand-100">
              {nextLesson.summary}
            </p>
            <span className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold text-brand-700">
              {lessonStatus(nextLesson.id) === "in_progress"
                ? "Continue"
                : "Begin"}{" "}
              →
            </span>
          </button>
        )}

        {!pendingQuizLesson && !nextLesson && (
          <div className="mb-5 rounded-2xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-100">
            <p className="text-2xl">🎉</p>
            <p className="mt-1 font-bold text-emerald-800">
              You finished the course!
            </p>
            <p className="text-sm text-emerald-700">
              Revisit any lesson to sharpen your skills.
            </p>
          </div>
        )}

        <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-slate-400">
          Lesson path
        </h2>
        <ul className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-3">
          {course.lessons.map((lesson, i) => {
            const status = lessonStatus(lesson.id);
            const locked = status === "locked";
            const hasQuiz = !!getLessonQuiz(lesson.id);
            const qStatus = quizStatus(lesson.id);
            const qLocked = qStatus === "locked";
            const qResult = quizResult(lesson.id);
            return (
              <Fragment key={lesson.id}>
                <li>
                  <button
                    disabled={locked}
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                    className={`card flex w-full items-center gap-4 p-4 text-left transition ${
                      locked
                        ? "opacity-60"
                        : "active:scale-[0.99] hover:shadow-md"
                    }`}
                  >
                    <LessonIcon status={status} n={i + 1} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold">{lesson.title}</p>
                        <StatusBadge status={status} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {lesson.summary}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {lesson.slides.length} steps · ~
                        {lesson.estimatedMinutes} min
                      </p>
                    </div>
                  </button>
                </li>
                {hasQuiz && (
                <li>
                  <button
                    disabled={qLocked}
                    onClick={() => navigate(`/quiz/${lesson.id}`)}
                    className={`flex w-full items-center gap-4 rounded-2xl border-l-4 border-violet-400 bg-violet-50/60 p-4 text-left shadow-sm ring-1 ring-violet-100 transition ${
                      qLocked
                        ? "opacity-60"
                        : "active:scale-[0.99] hover:shadow-md"
                    }`}
                  >
                    <QuizIcon status={qStatus} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold text-violet-900">
                          {lesson.title} quiz
                        </p>
                        <QuizBadge status={qStatus} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-violet-700/80">
                        {qLocked
                          ? "Complete the lesson to unlock this quiz."
                            : qResult
                            ? `Best ${
                                qResult.total > 0
                                  ? Math.round(
                                      (qResult.bestCorrect / qResult.total) *
                                        100,
                                    )
                                  : 0
                              }% · ${qResult.bestCorrect}/${qResult.total} · ${qResult.attempts} ${
                                qResult.attempts === 1 ? "attempt" : "attempts"
                              }`
                            : "Test what you learned from this lesson."}
                      </p>
                    </div>
                  </button>
                </li>
                )}
              </Fragment>
            );
          })}
        </ul>

        <p className="mt-6 text-center text-xs text-slate-400">
          Signed in as {user?.email}
        </p>
        </div>
      </main>
    </div>
  );
}
