export type LessonStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

/**
 * A bespoke interactive slide rendered by a custom React component.
 * `component` is a key into the custom-slide registry
 * (see src/components/slides/custom/registry.ts). This lets us build rich,
 * one-off visuals per slide without growing the type union for every idea.
 */
export type CustomSlide = {
  id: string;
  type: "custom";
  /** Registry key identifying which custom component renders this slide. */
  component: string;
  /** Optional title (the component may render its own heading). */
  title?: string;
};

export type Slide = CustomSlide;

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  /** Minutes, for the "short lesson" expectation. */
  estimatedMinutes: number;
  slides: Slide[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

/** Per-lesson progress persisted to Firestore. */
export type LessonProgress = {
  status: LessonStatus;
  firstIncompleteSlideIndex: number;
  updatedAt: number;
};

/** Map of lessonId -> progress. */
export type ProgressMap = Record<string, LessonProgress>;

export type UserStats = {
  currentStreak: number;
  /** ISO date string (yyyy-mm-dd) of last active day. */
  lastActiveDate: string | null;
  lessonsCompletedCount: number;
};

/**
 * A single procedurally-generated quiz question.
 *
 * Templates (src/quiz/templates/**) build one of these per slot of an attempt:
 * `params` holds the randomized numbers/strings the question view renders, and
 * `answer` is the expected (clean) value the learner must produce. The view in
 * QuizQuestionSpec consumes this shape, which is interactive, not multiple-choice.
 */
export type GeneratedQuestion = {
  /** Randomized inputs the question view renders (numbers and/or labels). */
  params: Record<string, number | string>;
  /** The expected answer the learner must produce. */
  answer: number | string;
};

/**
 * A lesson's post-lesson quiz definition. References question templates by id
 * (see src/quiz/registry.ts); `drawQuiz` (src/content/quizzes.ts) cycles through
 * `templateIds` to generate `questionCount` fresh questions per attempt.
 */
export type LessonQuiz = {
  /** Id of the lesson this quiz belongs to (matches Lesson.id). */
  lessonId: string;
  /** Template ids (src/quiz/registry.ts) this quiz draws questions from. */
  templateIds: string[];
  /** Number of questions presented per attempt (5 for the MVP). */
  questionCount: number;
  /**
   * Optional per-question style indices applied (shuffled) across an attempt.
   * Lets a single template render several interaction variants in fixed
   * proportions (e.g. Lesson 2: two cross-out, two fill-formula, one product).
   */
  stylePlan?: number[];
};

/**
 * Best-of result for a single lesson's quiz, persisted to Firestore. We keep the
 * best score across attempts; "best %" is `bestCorrect / total * 100`.
 */
export type QuizResult = {
  /** Highest number of correct answers achieved across attempts. */
  bestCorrect: number;
  /** Total questions in the attempt that produced the best score. */
  total: number;
  /** How many times the learner has attempted this quiz. */
  attempts: number;
  updatedAt: number;
};

/** Map of lessonId -> best quiz result. */
export type QuizResultMap = Record<string, QuizResult>;

/**
 * A stored quiz mistake, one per wrong question of a lesson's best attempt.
 * Rendered as an "ant" in the Ant Colony; clearing it recovers one quiz point.
 * The question *type* (template id + optional style variant) lets the colony
 * generate fresh practice questions, while the optional `params`/`answer` snapshot
 * the exact missed instance so the "Spot the Slip" critique can build a wrong
 * example targeting that specific problem. Both are optional for backward
 * compatibility with ants stored before this snapshot was captured.
 */
export type Mistake = {
  id: string;
  lessonId: string;
  /** Quiz template id (src/quiz/registry.ts), e.g. "permutation". */
  templateId: string;
  /** Optional style variant index (e.g. permutation's cross-out/fill/product). */
  style?: number;
  /** The randomized inputs of the exact question the learner missed. */
  params?: Record<string, number | string>;
  /** The correct answer to the exact question the learner missed. */
  answer?: number | string;
  createdAt: number;
};

/** Map of lessonId -> outstanding mistakes (ants) for that lesson. */
export type MistakeMap = Record<string, Mistake[]>;

/** Minimal descriptor of a wrong question captured during a quiz attempt. */
export type WrongQuestion = {
  templateId: string;
  style?: number;
  /** The randomized inputs of the missed question (for the critique example). */
  params?: Record<string, number | string>;
  /** The correct answer to the missed question. */
  answer?: number | string;
};

/** Status of a lesson's post-lesson quiz, derived from progress + results. */
export type QuizStatus = "locked" | "available" | "failed" | "passed";
