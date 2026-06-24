import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useProgress } from "../progress/ProgressContext";
import { course } from "../content/course";
import type { LessonStatus } from "../types";

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

export default function CoursePath() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const { lessonStatus, completedCount, totalLessons, stats, loading } =
    useProgress();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading your progress...
      </div>
    );
  }

  const pct = Math.round((completedCount / totalLessons) * 100);
  const nextLesson = course.lessons.find(
    (l) => lessonStatus(l.id) !== "completed",
  );

  return (
    <div className="flex h-full flex-col">
      <header className="bg-brand-500 px-5 pb-6 pt-8 text-white">
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
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-5">
        {nextLesson && (
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

        {!nextLesson && (
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
        <ul className="space-y-3">
          {course.lessons.map((lesson, i) => {
            const status = lessonStatus(lesson.id);
            const locked = status === "locked";
            return (
              <li key={lesson.id}>
                <button
                  disabled={locked}
                  onClick={() => navigate(`/lesson/${lesson.id}`)}
                  className={`card flex w-full items-center gap-4 p-4 text-left transition ${
                    locked ? "opacity-60" : "active:scale-[0.99] hover:shadow-md"
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
                      {lesson.slides.length} steps · ~{lesson.estimatedMinutes}{" "}
                      min
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-center text-xs text-slate-400">
          Signed in as {user?.email}
        </p>
      </main>
    </div>
  );
}
