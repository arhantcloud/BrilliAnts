import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { useProgress } from "../progress/progress-context";
import { course } from "../content/course";
import { FINAL_QUIZ_ID, getLessonQuiz } from "../content/quizzes";
import { shortTitle } from "../content/shortTitles";
import type { LessonStatus } from "../types";

type QuizStatus = "locked" | "available" | "passed" | "failed";

/** Sunday-first day initials for the weekly streak row. */
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoToday(): string {
  return localDateStr(new Date());
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

/**
 * Weekly streak row: a hole for each day of the current week (Sun → Sat). Days
 * that fall inside the active streak window (the `currentStreak` consecutive
 * days ending on `lastActiveDate`) are filled green; today is ringed.
 */
function WeekStreak({
  currentStreak,
  lastActiveDate,
}: {
  currentStreak: number;
  lastActiveDate: string | null;
}) {
  const today = isoToday();
  const dow = new Date(today + "T00:00:00").getDay();
  const weekStart = addDays(today, -dow);
  const streakStart =
    lastActiveDate && currentStreak > 0
      ? addDays(lastActiveDate, -(currentStreak - 1))
      : null;

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    // A day is filled only if it's inside the streak window AND not in the future.
    const completed = Boolean(
      streakStart &&
        lastActiveDate &&
        date >= streakStart &&
        date <= lastActiveDate &&
        date <= today,
    );
    return { date, letter: DAY_LETTERS[i], completed, isToday: date === today };
  });

  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5"
      aria-label={`Daily streak: ${currentStreak} day${currentStreak === 1 ? "" : "s"}`}
    >
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-bold uppercase leading-none text-brand-100/80">
            {d.letter}
          </span>
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
              d.completed
                ? "bg-lime-500 text-brand-900 shadow-sm"
                : "bg-brand-900/40 shadow-inner ring-1 ring-inset ring-white/10"
            } ${d.isToday ? "ring-2 ring-white" : ""}`}
          >
            {d.completed && (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden>
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: LessonStatus }) {
  const map: Record<LessonStatus, { label: string; cls: string }> = {
    completed: { label: "Done", cls: "bg-lime-100 text-lime-700" },
    in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
    available: { label: "Start", cls: "bg-orange-100 text-[#bf5700]" },
    locked: { label: "Locked", cls: "bg-stone-100 text-stone-400" },
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime-600 text-white">
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#bf5700] text-lg font-bold text-white">
      {n}
    </div>
  );
}

function QuizBadge({ status }: { status: QuizStatus }) {
  const map: Record<QuizStatus, { label: string; cls: string }> = {
    passed: { label: "Passed", cls: "bg-lime-100 text-lime-700" },
    failed: { label: "Retry", cls: "bg-red-100 text-red-800" },
    available: { label: "Take quiz", cls: "bg-brand-100 text-brand-700" },
    locked: { label: "Locked", cls: "bg-stone-100 text-stone-400" },
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
        </svg>
      </div>
    );
  }
  const tone =
    status === "passed"
      ? "bg-lime-600"
      : status === "failed"
        ? "bg-red-700"
        : "bg-brand-700";
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
    totalMistakes,
  } = useProgress();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-stone-400">
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

  const finalStatus = quizStatus(FINAL_QUIZ_ID);
  const finalResult = quizResult(FINAL_QUIZ_ID);
  const finalLocked = finalStatus === "locked";
  const finalQuestionCount = getLessonQuiz(FINAL_QUIZ_ID)?.questionCount ?? 0;

  return (
    <div className="flex h-full flex-col">
      <header className="bg-brand-700 px-5 pb-6 pt-8 text-white sm:px-8">
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
            <WeekStreak
              currentStreak={stats.currentStreak}
              lastActiveDate={stats.lastActiveDate}
            />
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
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-umber-100">
            <span className="flex items-center gap-1">
              <span aria-hidden>🎯</span>
              Quiz points · {quizPointsEarned} / {quizPointsTotal}
            </span>
            <span>{quizPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-lime-500 transition-all duration-500"
              style={{ width: `${quizPct}%` }}
            />
          </div>
        </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
        {pendingQuizLesson && (
          <button
            onClick={() => navigate(`/quiz/${pendingQuizLesson.id}`)}
            className="w-full rounded-2xl bg-brand-700 p-5 text-left text-white shadow-md transition active:scale-[0.99] sm:flex-1"
          >
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-100">
              <span aria-hidden>🎯</span>
              {quizStatus(pendingQuizLesson.id) === "failed"
                ? "Retry your quiz"
                : "Quiz unlocked"}
            </p>
            <p className="mt-1 text-lg font-bold">
              {pendingQuizLesson.title} quiz
            </p>
            <p className="mt-0.5 text-sm text-brand-100">
              {quizStatus(pendingQuizLesson.id) === "failed"
                ? "Pass it to unlock the next lesson."
                : "Test what you learned to unlock the next lesson."}
            </p>
            <span className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold text-brand-700">
              Take the quiz →
            </span>
          </button>
        )}

        {!pendingQuizLesson && nextLessonUnlocked && nextLesson && (
          <button
            onClick={() => navigate(`/lesson/${nextLesson.id}`)}
            className="w-full rounded-2xl bg-brand-700 p-5 text-left text-white shadow-md transition active:scale-[0.99] sm:flex-1"
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
          <div className="w-full rounded-2xl bg-lime-50 p-5 text-center ring-1 ring-lime-100 sm:flex-1">
            <p className="text-2xl">🎉</p>
            <p className="mt-1 font-bold text-lime-800">
              You finished the course!
            </p>
            <p className="text-sm text-lime-700">
              Revisit any lesson to sharpen your skills.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate("/colony")}
          className={`w-full rounded-2xl p-5 text-left shadow-md transition active:scale-[0.99] sm:flex-1 ${
            totalMistakes > 0
              ? "bg-[#d8701e] text-white"
              : "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 ring-1 ring-amber-300"
          }`}
        >
          <p
            className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${
              totalMistakes > 0 ? "text-amber-100" : "text-amber-700"
            }`}
          >
            <span aria-hidden>🐜</span> Ant Colony
          </p>
          <p className="mt-1 text-lg font-bold">
            {totalMistakes > 0
              ? `${totalMistakes} ${totalMistakes === 1 ? "ant" : "ants"} to rescue`
              : "Colony empty"}
          </p>
          <p
            className={`mt-0.5 text-sm ${
              totalMistakes > 0 ? "text-amber-100" : "text-amber-700/80"
            }`}
          >
            {totalMistakes > 0
              ? "Clear mistakes to win back quiz points."
              : "Quiz mistakes show up here to review."}
          </p>
          <span
            className={`mt-3 inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold ${
              totalMistakes > 0 ? "text-[#bf5700]" : "text-amber-700"
            }`}
          >
            {totalMistakes > 0 ? "Rescue ants →" : "Visit colony →"}
          </span>
        </button>
        </div>

        <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-stone-400">
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
                        <p className="truncate font-bold">
                          {shortTitle(lesson.id, lesson.title)}
                        </p>
                        <StatusBadge status={status} />
                      </div>
                      <p className="mt-1 text-xs text-stone-400">
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
                    className={`flex w-full items-center gap-4 rounded-2xl border-l-4 border-brand-700 bg-white p-4 text-left shadow-md ring-1 ring-brand-200 transition ${
                      qLocked
                        ? "opacity-60"
                        : "active:scale-[0.99] hover:shadow-md"
                    }`}
                  >
                    <QuizIcon status={qStatus} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold text-brand-900">
                          {shortTitle(lesson.id, lesson.title)} quiz
                        </p>
                        <QuizBadge status={qStatus} />
                      </div>
                      {qResult && (
                        <p className="mt-0.5 truncate text-sm text-brand-700/80">
                          {`Best ${
                            qResult.total > 0
                              ? Math.round(
                                  (qResult.bestCorrect / qResult.total) * 100,
                                )
                              : 0
                          }% · ${qResult.bestCorrect}/${qResult.total} · ${qResult.attempts} ${
                            qResult.attempts === 1 ? "attempt" : "attempts"
                          }`}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
                )}
              </Fragment>
            );
          })}
        </ul>

        <h2 className="mb-3 mt-8 px-1 text-sm font-bold uppercase tracking-wide text-stone-400">
          Final exam
        </h2>
        <button
          disabled={finalLocked}
          onClick={() => navigate(`/quiz/${FINAL_QUIZ_ID}`)}
          className={`flex w-full items-center gap-4 rounded-2xl p-5 text-left shadow-md transition ${
            finalLocked
              ? "bg-stone-100 opacity-70"
              : finalStatus === "passed"
                ? "bg-gradient-to-br from-lime-600 to-brand-700 text-white hover:shadow-lg active:scale-[0.99]"
                : "bg-gradient-to-br from-umber-600 to-brand-800 text-white hover:shadow-lg active:scale-[0.99]"
          }`}
        >
          <span className="text-3xl" aria-hidden>
            {finalLocked ? "🔒" : finalStatus === "passed" ? "🏆" : "🎓"}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                finalLocked ? "text-stone-400" : "text-umber-100"
              }`}
            >
              {finalQuestionCount}-question final · all topics
            </p>
            <p
              className={`mt-0.5 text-lg font-bold ${
                finalLocked ? "text-stone-500" : ""
              }`}
            >
              Course Final Exam
            </p>
            {finalResult && (
              <p
                className={`mt-0.5 text-sm ${
                  finalLocked ? "text-stone-400" : "text-umber-100"
                }`}
              >
                {`Best ${
                  finalResult.total > 0
                    ? Math.round(
                        (finalResult.bestCorrect / finalResult.total) * 100,
                      )
                    : 0
                }% · ${finalResult.bestCorrect}/${finalResult.total} · ${
                  finalResult.attempts
                } ${finalResult.attempts === 1 ? "attempt" : "attempts"}`}
              </p>
            )}
          </div>
          {!finalLocked && (
            <span aria-hidden className="text-lg font-bold">
              →
            </span>
          )}
        </button>

        <p className="mt-6 text-center text-xs text-stone-400">
          Signed in as {user?.email}
        </p>
        </div>
      </main>
    </div>
  );
}
