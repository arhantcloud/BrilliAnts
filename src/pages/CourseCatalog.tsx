import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { useProgress } from "../progress/progress-context";
import { course } from "../content/course";
import { getLessonQuiz } from "../content/quizzes";

/** Stylized ant hill mound used as the visual anchor of a course card. */
function AntHill({ complete }: { complete: boolean }) {
  return (
    <svg
      viewBox="0 0 120 96"
      className="h-24 w-28 shrink-0"
      role="img"
      aria-label="Ant hill"
    >
      {/* ground line */}
      <ellipse cx="60" cy="86" rx="56" ry="8" className="fill-amber-200/70" />
      {/* mound layers */}
      <path
        d="M14 86 C26 44 44 24 60 24 C76 24 94 44 106 86 Z"
        className="fill-amber-700"
      />
      <path
        d="M28 86 C36 56 48 40 60 40 C72 40 84 56 92 86 Z"
        className="fill-amber-600"
      />
      <path
        d="M42 86 C46 66 52 54 60 54 C68 54 74 66 78 86 Z"
        className="fill-amber-500"
      />
      {/* entrance hole */}
      <ellipse cx="60" cy="80" rx="9" ry="6" className="fill-stone-800/80" />
      {/* marching ants */}
      <circle cx="22" cy="80" r="2.4" className="fill-stone-800" />
      <circle cx="32" cy="74" r="2.4" className="fill-stone-800" />
      <circle cx="92" cy="78" r="2.4" className="fill-stone-800" />
      {complete && (
        <text x="60" y="20" textAnchor="middle" fontSize="18">
          🏆
        </text>
      )}
    </svg>
  );
}

function Bar({
  label,
  value,
  count,
  barClass,
}: {
  label: string;
  value: number;
  count: string;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
        <span>
          {label} · {count}
        </span>
        <span>{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function CourseCatalog() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const {
    loading,
    quizStatus,
    completedCount,
    totalLessons,
    quizPointsEarned,
    quizPointsTotal,
    stats,
  } = useProgress();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading your progress...
      </div>
    );
  }

  const progressPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const masteryPct =
    quizPointsTotal > 0
      ? Math.round((quizPointsEarned / quizPointsTotal) * 100)
      : 0;

  // No standalone final exam exists in this course, so "complete" means every
  // lesson is finished and every lesson quiz has been passed.
  const quizLessons = course.lessons.filter((l) => getLessonQuiz(l.id));
  const allQuizzesPassed = quizLessons.every(
    (l) => quizStatus(l.id) === "passed",
  );
  const courseComplete =
    completedCount === totalLessons && allQuizzesPassed;

  return (
    <div className="flex h-full flex-col">
      <header className="bg-brand-500 px-5 pb-6 pt-8 text-white sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
              Welcome back
            </p>
            <h1 className="mt-1 text-xl font-extrabold leading-tight">
              Your courses
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
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <li>
              <button
                onClick={() => navigate("/course")}
                className="card flex w-full flex-col gap-4 p-5 text-left transition hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start gap-4">
                  <AntHill complete={courseComplete} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-extrabold leading-tight text-slate-800">
                        {course.title}
                      </h2>
                      {courseComplete && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          Course complete
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {course.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Bar
                    label="Course progress"
                    value={progressPct}
                    count={`${completedCount}/${totalLessons} lessons`}
                    barClass="bg-brand-500"
                  />
                  <Bar
                    label="Mastery"
                    value={masteryPct}
                    count={`${quizPointsEarned}/${quizPointsTotal} quiz points`}
                    barClass="bg-gradient-to-r from-violet-400 to-indigo-300"
                  />
                </div>

                <span className="inline-block text-sm font-bold text-brand-700">
                  {courseComplete
                    ? "Review course →"
                    : completedCount > 0
                      ? "Continue →"
                      : "Start course →"}
                </span>
              </button>
            </li>
          </ul>

          <p className="mt-6 text-center text-xs text-slate-400">
            Signed in as {user?.email}
          </p>
        </div>
      </main>
    </div>
  );
}
