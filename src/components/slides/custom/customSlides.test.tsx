import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { customSlideRegistry } from "./registry";
import type { CustomSlide } from "../../../types";

function makeSlide(component: string): CustomSlide {
  return { id: `t-${component}`, type: "custom", component };
}

function renderSlide(component: string, onComplete = vi.fn()) {
  const Comp = customSlideRegistry[component];
  if (!Comp) throw new Error(`no component for ${component}`);
  render(<Comp slide={makeSlide(component)} onComplete={onComplete} />);
  return onComplete;
}

// Components that satisfy completion on mount (explore / review / explorer).
const MOUNT_COMPLETE = [
  "four-worlds-map",
  "review-map",
  "factorials",
  "permute-k",
  "refill-choices",
  "power-explorer",
  "reuse-compare",
  "collapse-orders",
  "combination-formula",
  "two-stories",
  "stars-bars",
  "fill-seats",
];

describe("custom slides: mount-complete behavior", () => {
  it.each(MOUNT_COMPLETE)(
    "%s calls onComplete on mount and renders a heading",
    (component) => {
      const onComplete = renderSlide(component);
      expect(onComplete).toHaveBeenCalled();
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    },
  );
});

// Components that gate completion behind a correct interaction never complete
// just by mounting.
const GATED = [
  "pizza-classify",
  "build-podium",
  "books-mcq",
  "build-flips",
  "pin-mcq",
  "select-team",
  "cards-mcq",
  "distribute-build",
  "multiset-mcq",
  "classify-examples",
];

describe("custom slides: gated slides do not complete on mount", () => {
  it.each(GATED)("%s does not call onComplete on mount", (component) => {
    const onComplete = renderSlide(component);
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
  });
});

describe("gated MCQ custom slides complete on the correct answer", () => {
  const cases: { component: string; correct: RegExp }[] = [
    { component: "pin-mcq", correct: /^10,000$/ },
    { component: "books-mcq", correct: /^120$/ },
    { component: "cards-mcq", correct: /^10$/ },
    { component: "multiset-mcq", correct: /^3$/ },
    {
      component: "pizza-classify",
      correct: /Order doesn't matter, with replacement/,
    },
  ];

  it.each(cases)(
    "$component completes when the right option is checked",
    async ({ component, correct }) => {
      const user = userEvent.setup();
      const onComplete = renderSlide(component);

      await user.click(screen.getByRole("button", { name: correct }));
      await user.click(screen.getByRole("button", { name: /check answer/i }));

      expect(screen.getByText("Correct!")).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledTimes(1);
    },
  );

  it("pin-mcq shows a hint and does not complete on a wrong answer", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("pin-mcq");

    await user.click(screen.getByRole("button", { name: /^5040$/ }));
    await user.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Not quite — try again")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("gated build/select custom slides", () => {
  it("build-flips completes after building Heads, Tails, Heads", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("build-flips");

    await user.click(screen.getByRole("button", { name: /^heads$/i }));
    await user.click(screen.getByRole("button", { name: /^tails$/i }));
    await user.click(screen.getByRole("button", { name: /^heads$/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("build-flips reports an incorrect sequence and lets you retry", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("build-flips");

    await user.click(screen.getByRole("button", { name: /^tails$/i }));
    await user.click(screen.getByRole("button", { name: /^tails$/i }));
    await user.click(screen.getByRole("button", { name: /^tails$/i }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Not quite — try again")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("select-team completes when the correct three are chosen", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("select-team");

    await user.click(screen.getByRole("button", { name: /^ana$/i }));
    await user.click(screen.getByRole("button", { name: /^cy$/i }));
    await user.click(screen.getByRole("button", { name: /^eve$/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("select-team does not complete on the wrong team", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("select-team");

    await user.click(screen.getByRole("button", { name: /^ana$/i }));
    await user.click(screen.getByRole("button", { name: /^bo$/i }));
    await user.click(screen.getByRole("button", { name: /^cy$/i }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Not quite — try again")).toBeInTheDocument();
  });

  it("distribute-build completes with one candy in each jar", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("distribute-build");

    // Initially the only buttons are the two jars.
    const jars = screen.getAllByRole("button");
    await user.click(jars[0]);
    const jarsAfter = screen.getAllByRole("button");
    await user.click(jarsAfter[1]);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });
});

describe("fill-seats interaction", () => {
  it("seats all four friends and shows the 4! total", async () => {
    const user = userEvent.setup();
    renderSlide("fill-seats");

    for (const name of ["Ava", "Ben", "Cy", "Dee"]) {
      await user.click(screen.getByRole("button", { name: new RegExp(`^${name}$`, "i") }));
    }

    expect(screen.getByText("Everyone is seated!")).toBeInTheDocument();
    expect(screen.getByText(/= 24/)).toBeInTheDocument();
  });
});
