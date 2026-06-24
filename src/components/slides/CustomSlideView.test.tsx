import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CustomSlideView from "./CustomSlideView";
import type { CustomSlide } from "../../types";

describe("CustomSlideView", () => {
  it("renders a friendly message for an unknown component key", () => {
    const slide: CustomSlide = {
      id: "x1",
      type: "custom",
      component: "does-not-exist",
    };
    render(<CustomSlideView slide={slide} onComplete={() => {}} />);
    expect(screen.getByText(/unknown slide component/i)).toBeInTheDocument();
    expect(screen.getByText("does-not-exist")).toBeInTheDocument();
  });

  it("renders a registered component", () => {
    const slide: CustomSlide = {
      id: "x2",
      type: "custom",
      component: "factorials",
      title: "Factorials",
    };
    render(<CustomSlideView slide={slide} onComplete={() => {}} />);
    // The Factorials component renders its own heading.
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});
