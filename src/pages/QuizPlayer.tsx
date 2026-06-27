import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { course } from "../content/course";
import { drawQuiz, FINAL_QUIZ_ID, getLessonQuiz } from "../content/quizzes";
import { getTemplate } from "../quiz/registry";
import { PASS_THRESHOLD, useProgress } from "../progress/progress-context";
import { useMascotOptional } from "../mascot/mascot-context";
import type { Lesson, WrongQuestion } from "../types";

/** Synthetic "lesson" wrapper for the end-of-course final exam. */
const FINAL_LESSON: Lesson = {
  id: FINAL_QUIZ_ID,
  title: "Final Exam",
  summary: "Everything from the course, in one go.",
  estimatedMinutes: 0,
  slides: [],
};

export default function QuizPlayer() {
  const { lessonId = "" } = useParams();
  const navigate = useNavigate();
  const { loading, quizStatus } = useProgress();

  const isFinal = lessonId === FINAL_QUIZ_ID;
  const lessonIndex = course.lessons.findIndex((l) => l.id === lessonId);
  const lesson = isFinal ? FINAL_LESSON : course.lessons[lessonIndex];

  // Bumping the attempt counter remounts <QuizRun>, which regenerates fresh
  // numbers for a retake.
  const [attempt, setAttempt] = useState(0);

  if (!lesson || !getLessonQuiz(lessonId)) {
    return (
      <CenteredMessage message="Quiz not found.">
        <button onClick={() => navigate("/")} className="btn-primary">
          Back to course
        </button>
      </CenteredMessage>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-stone-400">
        Loading...
      </div>
    );
  }

  if (quizStatus(lessonId) === "locked") {
    return (
      <CenteredMessage
        message={
          isFinal
            ? "Complete every lesson to unlock the final exam."
            : `Finish "${lesson.title}" to unlock its quiz.`
        }
      >
        {!isFinal && (
          <button
            onClick={() => navigate(`/lesson/${lessonId}`)}
            className="btn-primary"
          >
            Go to lesson
          </button>
        )}
        <button onClick={() => navigate("/")} className="btn-ghost">
          Back to course
        </button>
      </CenteredMessage>
    );
  }

  return (
    <QuizRun
      key={attempt}
      lesson={lesson}
      lessonIndex={lessonIndex}
      isFinal={isFinal}
      onRetake={() => setAttempt((a) => a + 1)}
    />
  );
}

function QuizRun({
  lesson,
  lessonIndex,
  isFinal,
  onRetake,
}: {
  lesson: Lesson;
  lessonIndex: number;
  isFinal: boolean;
  onRetake: () => void;
}) {
  const navigate = useNavigate();
  const { recordQuizAttempt } = useProgress();
  const mascot = useMascotOptional();

  // Generate once per mount; retakes remount via the `key` in the parent.
  const [questions] = useState(() => drawQuiz(lesson.id));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(boolean | undefined)[]>(() =>
    Array(questions.length).fill(undefined),
  );
  const [finished, setFinished] = useState(false);
  const recorded = useRef(false);
  // Scroll container for the question body; reset to the top on each new
  // question so tall multi-step questions (e.g. combinations) open at the
  // prompt rather than wherever the previous question left the scroll.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // `scrollTo` is unavailable in some environments (e.g. jsdom under test).
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [index]);

  const quiz = getLessonQuiz(lesson.id);
  const total = questions.length;
  const answered = results[index] !== undefined;
  const isLast = index === total - 1;
  const correctCount = results.filter((r) => r === true).length;
  // The final exam has no "next lesson" to advance to.
  const nextLesson = isFinal ? undefined : course.lessons[lessonIndex + 1];

  function handleResult(correct: boolean) {
    setResults((prev) => {
      if (prev[index] !== undefined) return prev;
      const copy = [...prev];
      copy[index] = correct;
      return copy;
    });
  }

  function advance() {
    if (!answered) return;
    // Clear the ant + its bubble/footprints/highlight before the slide changes.
    mascot?.dismiss();
    if (isLast) {
      if (!recorded.current) {
        recorded.current = true;
        // Capture each wrong question's type so a new high score can repopulate
        // the colony with one ant per missed point.
        // The final exam is summative, so its misses don't seed the Ant Colony
        // (those chambers are per-lesson), so we only capture wrongs elsewhere.
        const wrong: WrongQuestion[] = [];
        results.forEach((r, i) => {
          if (r !== false || !quiz || isFinal) return;
          const tId = quiz.templateIds[i % quiz.templateIds.length];
          const q = questions[i];
          const styleRaw = q?.params.style;
          wrong.push({
            templateId: tId,
            ...(typeof styleRaw === "number" ? { style: styleRaw } : {}),
            // Snapshot the exact missed instance so the colony's "Spot the Slip"
            // critique can build a wrong example for this specific problem.
            ...(q ? { params: q.params, answer: q.answer } : {}),
          });
        });
        recordQuizAttempt(lesson.id, correctCount, total, wrong);
      }
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (finished) {
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = percent >= PASS_THRESHOLD;
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl">{passed ? "🎉" : "💪"}</div>
        <h1 className="mt-4 text-2xl font-extrabold">
          {passed ? "Quiz passed!" : "Keep going!"}
        </h1>
        <p className="mt-1 text-stone-500">{lesson.title}</p>

        <div className="mt-6 flex items-center gap-3">
          <div className="card flex flex-col items-center px-5 py-3">
            <span className="text-2xl font-extrabold text-umber-600">
              {correctCount}/{total}
            </span>
            <span className="text-xs font-semibold text-stone-400">correct</span>
          </div>
          <div className="card flex flex-col items-center px-5 py-3">
            <span
              className={`text-2xl font-extrabold ${
                passed ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {percent}%
            </span>
            <span className="text-xs font-semibold text-stone-400">
              need {PASS_THRESHOLD}%
            </span>
          </div>
        </div>

        <div className="mt-6 w-full max-w-xs">
          <div
            className={`rounded-2xl p-4 text-left text-sm ring-1 ${
              passed
                ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                : "bg-amber-50 text-amber-900 ring-amber-100"
            }`}
          >
            {passed
              ? "Nice work! You've got a solid handle on this one."
              : `You need ${PASS_THRESHOLD}% to pass. Retake to try a fresh set of numbers.`}
          </div>
        </div>

        <div className="mt-8 w-full max-w-xs space-y-3">
          <button onClick={onRetake} className="btn-primary w-full">
            Retake quiz
          </button>
          {passed && nextLesson && (
            <button
              onClick={() => navigate(`/lesson/${nextLesson.id}`)}
              className="w-full rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98]"
            >
              Next lesson →
            </button>
          )}
          <button onClick={() => navigate("/")} className="btn-ghost w-full">
            Back to course path
          </button>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const templateId = quiz
    ? quiz.templateIds[index % quiz.templateIds.length]
    : undefined;
  const spec = templateId ? getTemplate(templateId) : undefined;
  const progressPct = Math.round(
    ((index + (answered ? 1 : 0)) / total) * 100,
  );

  return (
    <div className="flex h-full flex-col">
      <header className="relative z-[70] bg-[#f7f1ea] px-4 pb-3 pt-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <button
            onClick={() => navigate("/")}
            aria-label="Exit quiz"
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
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-umber-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="w-12 text-right text-xs font-bold text-stone-400">
            {index + 1}/{total}
          </span>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto px-5 py-4 sm:px-8 sm:py-6">
        <div className="mx-auto w-full max-w-xl">
          {spec ? (
            <spec.Component
              key={index}
              question={question}
              locked={answered}
              onResult={handleResult}
            />
          ) : (
            <p className="text-stone-500">This question could not be loaded.</p>
          )}
        </div>
      </main>

      <footer className="relative z-[70] border-t border-stone-100 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto w-full max-w-xl">
          <button
            onClick={advance}
            disabled={!answered}
            className="inline-flex w-full items-center justify-center rounded-xl bg-umber-600 px-4 py-3 font-semibold text-white transition hover:bg-umber-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {isLast ? "See results" : "Next"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function CenteredMessage({
  message,
  children,
}: {
  message: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-stone-500">{message}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
