import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ConceptSlideView from "./ConceptSlideView";
import type { ConceptSlide } from "../../types";

const slide: ConceptSlide = {
  id: "c1",
  type: "concept",
  title: "A concept",
  body: "Some explanation text.",
  points: ["First point", "Second point"],
};

describe("ConceptSlideView", () => {
  it("renders title, body, and bullet points", () => {
    render(<ConceptSlideView slide={slide} onComplete={() => {}} />);
    expect(screen.getByText("A concept")).toBeInTheDocument();
    expect(screen.getByText("Some explanation text.")).toBeInTheDocument();
    expect(screen.getByText("First point")).toBeInTheDocument();
    expect(screen.getByText("Second point")).toBeInTheDocument();
  });

  it("calls onComplete on mount (no interaction required)", () => {
    const onComplete = vi.fn();
    render(<ConceptSlideView slide={slide} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("renders without points", () => {
    const onComplete = vi.fn();
    render(
      <ConceptSlideView
        slide={{ ...slide, points: undefined }}
        onComplete={onComplete}
      />,
    );
    expect(screen.queryByText("First point")).not.toBeInTheDocument();
    expect(onComplete).toHaveBeenCalled();
  });
});
