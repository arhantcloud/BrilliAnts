export type LessonStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

export type ChoiceOption = {
  id: string;
  label: string;
};

/** A teaching slide: explains an idea, no required interaction. */
export type ConceptSlide = {
  id: string;
  type: "concept";
  title: string;
  body: string;
  /** Optional list of bullet takeaways. */
  points?: string[];
};

/** Multiple-choice slide. */
export type McqSlide = {
  id: string;
  type: "mcq";
  title: string;
  prompt: string;
  options: ChoiceOption[];
  correctOptionId: string;
  /** Shown after a correct answer. */
  explanation: string;
  /** Shown after a wrong answer to help recover. */
  hint: string;
};

/**
 * Drag/tap-to-build slide. The learner arranges `items` into the correct order.
 * A live visual (sequence + running count) responds as they build.
 */
export type BuildSequenceSlide = {
  id: string;
  type: "build_sequence";
  title: string;
  prompt: string;
  /** Items presented in scrambled order. */
  items: ChoiceOption[];
  /** Correct ordering as a list of item ids. */
  correctOrder: string[];
  /**
   * Visual mode that reacts to the current arrangement:
   * - "permutation": shows running count of distinct arrangements (n!/(n-k)!)
   * - "sequence": shows the built sequence as a sample-space path
   */
  visual: "permutation" | "sequence";
  explanation: string;
  hint: string;
};

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

export type Slide = ConceptSlide | McqSlide | BuildSequenceSlide | CustomSlide;

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
