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

// The full-run flow test uses a dial-based lesson (Lesson 4 / combinations) so
// it can drive five questions with the simple digit-dial helper. Lesson 2's
// permutation styles are exercised directly in src/quiz/quizQuestions.test.tsx.
const LESSON_ID = "l4-comb-no-rep";
const UID = "tester";

/** A dial-answered (combination-template) question with a known numeric answer. */
function q(answer: number): GeneratedQuestion {
  return { params: { n: 5, k: 2, theme: 0 }, answer };
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

/** Place-value wheels of the DialAnswer control, left-to-right. */
const DIAL_PLACES = ["hundreds", "tens", "ones"];

/** Spin the digit wheels (via their up chevrons) to display `value`. */
async function setDial(
  user: ReturnType<typeof userEvent.setup>,
  value: number,
) {
  const digits = String(value)
    .padStart(DIAL_PLACES.length, "0")
    .split("")
    .map(Number);
  for (let i = 0; i < digits.length; i++) {
    const up = screen.getByRole("button", {
      name: `Increase ${DIAL_PLACES[i]} digit`,
    });
    for (let c = 0; c < digits[i]; c++) await user.click(up);
  }
}

/** Answer the current question (correct or wrong) and advance to the next slide. */
async function answerCurrent(
  user: ReturnType<typeof userEvent.setup>,
  question: GeneratedQuestion,
  correct: boolean,
  isLast: boolean,
) {
  await screen.findByRole("button", { name: "Increase ones digit" });
  const value = correct ? Number(question.answer) : Number(question.answer) + 1;
  await setDial(user, value);
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
    await screen.findByRole("button", { name: "Increase ones digit" });
    expect(drawQuizMock).toHaveBeenCalledTimes(1);

    await playRun(user, questions, 5);
    expect(await screen.findByText(/quiz passed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retake quiz/i }));

    // Retake remounts the run, drawing a brand-new set, and returns to Q1.
    expect(
      await screen.findByRole("button", { name: "Increase ones digit" }),
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
