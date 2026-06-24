import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import McqSlideView from "./McqSlideView";
import type { McqSlide } from "../../types";

const slide: McqSlide = {
  id: "m1",
  type: "mcq",
  title: "Pick the right one",
  prompt: "Which is correct?",
  options: [
    { id: "a", label: "Wrong" },
    { id: "b", label: "Right" },
  ],
  correctOptionId: "b",
  explanation: "Because B is right.",
  hint: "Try the other one.",
};

describe("McqSlideView", () => {
  it("does not complete and shows the hint when the wrong answer is chosen", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<McqSlideView slide={slide} onComplete={onComplete} />);

    await user.click(screen.getByText("Wrong"));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Not quite — try again")).toBeInTheDocument();
    expect(screen.getByText("Try the other one.")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    // Still allows retrying.
    expect(
      screen.getByRole("button", { name: /check answer/i }),
    ).toBeInTheDocument();
  });

  it("completes and shows the explanation when the correct answer is chosen", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<McqSlideView slide={slide} onComplete={onComplete} />);

    await user.click(screen.getByText("Right"));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("Because B is right.")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    // The check button is removed once solved.
    expect(
      screen.queryByRole("button", { name: /check answer/i }),
    ).not.toBeInTheDocument();
  });

  it("disables checking until an option is selected", () => {
    render(<McqSlideView slide={slide} onComplete={() => {}} />);
    expect(screen.getByRole("button", { name: /check answer/i })).toBeDisabled();
  });

  it("can recover from a wrong answer and then succeed", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<McqSlideView slide={slide} onComplete={onComplete} />);

    await user.click(screen.getByText("Wrong"));
    await user.click(screen.getByRole("button", { name: /check answer/i }));
    await user.click(screen.getByText("Right"));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });
});
