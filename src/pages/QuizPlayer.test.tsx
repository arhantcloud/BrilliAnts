import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { ProgressProvider } from "../progress/ProgressContext";
import QuizPlayer from "./QuizPlayer";
import { drawQuiz } from "../content/quizzes";
import { emptyStats } from "../data/persistence";
import type { GeneratedQuestion } from "../types";

// Drive the player with a deterministic question set so we control the score.
// getLessonQuiz (and the rest of the module) stays real; only generation is faked.
vi.mock("../content/quizzes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../content/quizzes")>();
  return { ...actual, drawQuiz: vi.fn() };
});

const drawQuizMock = vi.mocked(drawQuiz);

// The full-run flow test uses Lesson 4 (combinations) so it can drive five
// questions with one helper. The combination template is a fill-the-formula
// derivation; Lesson 2's permutation styles are exercised directly in
// src/quiz/quizQuestions.test.tsx.
const LESSON_ID = "l4-comb-no-rep";
const UID = "tester";

// All five mocked questions share n = 5, k = 2, so the derivation's
// intermediate blanks are constant: P(5,2) = 20 and 2! = 2.
const Q_N = 5;
const Q_K = 2;
const Q_P = 20;
const Q_KF = 2;

/** A combination-template question with a known numeric (final) answer. */
function q(answer: number): GeneratedQuestion {
  return { params: { n: Q_N, k: Q_K, theme: 0 }, answer };
}

/** Five questions with distinct, known answers. */
function fiveQuestions(): GeneratedQuestion[] {
  return [q(11), q(22), q(33), q(44), q(55)];
}

function seedCompletedLesson() {
  localStorage.setItem(
    "cc_local_session",
    JSON.stringify({ uid: UID, email: "t@example.com" }),
  );
  localStorage.setItem(
    `cc_userdata_${UID}`,
    JSON.stringify({
      progress: {
        [LESSON_ID]: {
          status: "completed",
          firstIncompleteSlideIndex: 99,
          updatedAt: Date.now(),
        },
      },
      quizzes: {},
      stats: { ...emptyStats },
    }),
  );
}

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={[`/quiz/${LESSON_ID}`]}>
      <AuthProvider>
        <ProgressProvider>
          <Routes>
            <Route path="/quiz/:lessonId" element={<QuizPlayer />} />
            <Route path="/" element={<div>course path home</div>} />
            <Route path="/lesson/:lessonId" element={<div>lesson page</div>} />
          </Routes>
        </ProgressProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

/** The combination derivation's first textbox, used to detect a mounted question. */
const FIRST_FIELD = "permutation n";

/** Fill the combination derivation, getting the final result right or wrong. */
async function fillCombination(
  user: ReturnType<typeof userEvent.setup>,
  question: GeneratedQuestion,
  correct: boolean,
) {
  const fill = async (name: string, v: number) =>
    user.type(screen.getByRole("textbox", { name }), String(v));
  await fill("permutation n", Q_N);
  await fill("permutation k", Q_K);
  await fill("permutation count", Q_P);
  await fill("k base", Q_K);
  await fill("k factorial count", Q_KF);
  await fill("combination n", Q_N);
  await fill("combination k", Q_K);
  await fill("numerator", Q_P);
  await fill("denominator", Q_KF);
  await fill(
    "combination result",
    correct ? Number(question.answer) : Number(question.answer) + 1,
  );
}

/** Answer the current question (correct or wrong) and advance to the next slide. */
async function answerCurrent(
  user: ReturnType<typeof userEvent.setup>,
  question: GeneratedQuestion,
  correct: boolean,
  isLast: boolean,
) {
  await screen.findByRole("textbox", { name: FIRST_FIELD });
  await fillCombination(user, question, correct);
  await user.click(screen.getByRole("button", { name: /^submit$/i }));
  await user.click(
    screen.getByRole("button", { name: isLast ? /see results/i : /^next$/i }),
  );
}

/** Walk the whole 5-question run, marking the first `numCorrect` correct. */
async function playRun(
  user: ReturnType<typeof userEvent.setup>,
  questions: GeneratedQuestion[],
  numCorrect: number,
) {
  for (let i = 0; i < questions.length; i++) {
    await answerCurrent(user, questions[i], i < numCorrect, i === questions.length - 1);
  }
}

describe("QuizPlayer", () => {
  beforeEach(() => {
    localStorage.clear();
    drawQuizMock.mockReset();
    drawQuizMock.mockReturnValue(fiveQuestions());
    seedCompletedLesson();
  });

  it("passes with 3/5 correct (60% meets the threshold)", async () => {
    const user = userEvent.setup();
    const questions = fiveQuestions();
    drawQuizMock.mockReturnValue(questions);

    renderQuiz();
    await playRun(user, questions, 3);

    expect(await screen.findByText(/quiz passed/i)).toBeInTheDocument();
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("fails with 2/5 correct (40% is below the threshold)", async () => {
    const user = userEvent.setup();
    const questions = fiveQuestions();
    drawQuizMock.mockReturnValue(questions);

    renderQuiz();
    await playRun(user, questions, 2);

    expect(await screen.findByText(/keep going/i)).toBeInTheDocument();
    expect(screen.getByText("2/5")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("regenerates a fresh question set on Retake", async () => {
    const user = userEvent.setup();
    const questions = fiveQuestions();
    drawQuizMock.mockReturnValue(questions);

    renderQuiz();
    // Wait for the run to mount (first draw) then finish it.
    await screen.findByRole("textbox", { name: FIRST_FIELD });
    expect(drawQuizMock).toHaveBeenCalledTimes(1);

    await playRun(user, questions, 5);
    expect(await screen.findByText(/quiz passed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retake quiz/i }));

    // Retake remounts the run, drawing a brand-new set, and returns to Q1.
    expect(
      await screen.findByRole("textbox", { name: FIRST_FIELD }),
    ).toBeInTheDocument();
    expect(drawQuizMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("1/5")).toBeInTheDocument();
  });

  it("blocks the quiz until the lesson is completed", async () => {
    localStorage.setItem(
      `cc_userdata_${UID}`,
      JSON.stringify({ progress: {}, quizzes: {}, stats: { ...emptyStats } }),
    );

    renderQuiz();

    expect(
      await screen.findByText(/finish .* to unlock its quiz/i),
    ).toBeInTheDocument();
    expect(drawQuizMock).not.toHaveBeenCalled();
  });
});
