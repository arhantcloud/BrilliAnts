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
  "refill-choices",
  "reuse-compare",
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
  "fill-seats",
  "permute-k",
  "permutation-formula",
  "power-explorer",
  "crack-the-code",
  "collapse-orders",
  "combination-formula",
  "handshake-party",
  "two-stories",
  "stars-bars",
  "stars-bars-formula",
  "donut-box",
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

  it("select-team completes when any three friends are chosen", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("select-team");

    await user.click(screen.getByRole("button", { name: /^ana$/i }));
    await user.click(screen.getByRole("button", { name: /^bo$/i }));
    expect(onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /^cy$/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/combination/i)).toBeInTheDocument();
  });

  it("select-team does not complete before three are chosen", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("select-team");

    await user.click(screen.getByRole("button", { name: /^ana$/i }));
    await user.click(screen.getByRole("button", { name: /^cy$/i }));

    expect(onComplete).not.toHaveBeenCalled();
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
  it("gates completion until all seats are filled and the total is entered", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("fill-seats");

    for (const name of ["Ava", "Ben", "Cy", "Dee"]) {
      await user.click(
        screen.getByRole("button", { name: new RegExp(`^${name}$`, "i") }),
      );
    }

    // Seats filled, but the learner still has to fill in the product.
    expect(screen.getByText("Everyone is seated!")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    const input = screen.getByRole("textbox", {
      name: /total number of arrangements/i,
    });
    await user.type(input, "24");

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/that's 4!/)).toBeInTheDocument();
  });

  it("does not complete when the wrong total is entered", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("fill-seats");

    for (const name of ["Ava", "Ben", "Cy", "Dee"]) {
      await user.click(
        screen.getByRole("button", { name: new RegExp(`^${name}$`, "i") }),
      );
    }
    const input = screen.getByRole("textbox", {
      name: /total number of arrangements/i,
    });
    await user.type(input, "12");

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText(/multiply 4 × 3 × 2 × 1/)).toBeInTheDocument();
  });
});

describe("permute-k interaction", () => {
  it("completes when both factorial numbers and the result are entered (n=5, k=3)", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("permute-k");

    expect(onComplete).not.toHaveBeenCalled();

    const total = screen.getByRole("textbox", {
      name: /number in front of the total factorial/i,
    });
    const tail = screen.getByRole("textbox", {
      name: /number in front of the tail factorial/i,
    });
    const answer = screen.getByRole("textbox", { name: /value it equals/i });

    // n=5 → 5!; tail = (5-3)! = 2!; 5!/2! = 60.
    await user.type(total, "5");
    await user.type(tail, "2");
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(answer, "60");

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/picking 3 of 5 cars in order/i)).toBeInTheDocument();
  });

  it("does not complete when the result is wrong", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("permute-k");

    await user.type(
      screen.getByRole("textbox", {
        name: /number in front of the total factorial/i,
      }),
      "5",
    );
    await user.type(
      screen.getByRole("textbox", {
        name: /number in front of the tail factorial/i,
      }),
      "2",
    );
    await user.type(
      screen.getByRole("textbox", { name: /value it equals/i }),
      "120",
    );

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("collapse-orders interaction", () => {
  it("completes after collapsing and dividing 12 ÷ 2 = 6", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("collapse-orders");

    // Inputs are hidden until the duplicates are collapsed.
    await user.click(
      screen.getByRole("button", { name: /collapse duplicates/i }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /orderings\/team/i }),
      "2",
    );
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(screen.getByRole("textbox", { name: /^teams$/i }), "6");

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not complete on a wrong division", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("collapse-orders");

    await user.click(
      screen.getByRole("button", { name: /collapse duplicates/i }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /orderings\/team/i }),
      "3",
    );
    await user.type(screen.getByRole("textbox", { name: /^teams$/i }), "4");

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("permutation-formula interaction (tap to place)", () => {
  async function tapTile(
    user: ReturnType<typeof userEvent.setup>,
    value: string,
  ) {
    const tiles = screen.getAllByRole("button", { name: `tile ${value}` });
    await user.click(tiles[0]);
  }

  it("completes when the formula n! / (n−k)! is assembled", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("permutation-formula");

    // Slots fill left→right: numA(n) numB(!) denA(n) denB(k) denC(!).
    await tapTile(user, "n");
    await tapTile(user, "!");
    await tapTile(user, "n");
    await tapTile(user, "k");
    expect(onComplete).not.toHaveBeenCalled();
    await tapTile(user, "!");

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/210 ways to fill/i)).toBeInTheDocument();
  });

  it("shows 'Not quite' for a wrong arrangement and does not complete", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("permutation-formula");

    await tapTile(user, "m"); // numA should be n
    await tapTile(user, "!");
    await tapTile(user, "n");
    await tapTile(user, "k");
    await tapTile(user, "!");

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Not quite")).toBeInTheDocument();
  });
});

describe("power-explorer interaction (tap to place)", () => {
  async function tapTile(
    user: ReturnType<typeof userEvent.setup>,
    value: string,
  ) {
    const tiles = screen.getAllByRole("button", { name: `tile ${value}` });
    await user.click(tiles[0]);
  }

  it("completes when the base n and exponent k are placed", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("power-explorer");

    // Slots fill left→right: base(n) then exp(k).
    await tapTile(user, "n");
    expect(onComplete).not.toHaveBeenCalled();
    await tapTile(user, "k");

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/each of the k positions/i)).toBeInTheDocument();
  });

  it("shows 'Not quite' when base and exponent are swapped", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("power-explorer");

    await tapTile(user, "k"); // base should be n
    await tapTile(user, "n"); // exp should be k

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Not quite")).toBeInTheDocument();
  });
});

describe("combination-formula interaction (tap to place)", () => {
  async function tapTile(
    user: ReturnType<typeof userEvent.setup>,
    value: string,
  ) {
    const tiles = screen.getAllByRole("button", { name: `tile ${value}` });
    await user.click(tiles[0]);
  }

  it("completes when n! / (k! (n−k)!) is assembled", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("combination-formula");

    // Order: numA(n) numB(!) denA(k) denB(!) denC(n) denD(k) denE(!).
    for (const v of ["n", "!", "k", "!", "n", "k"]) await tapTile(user, v);
    expect(onComplete).not.toHaveBeenCalled();
    await tapTile(user, "!");

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/C\(5, 3\)/i)).toBeInTheDocument();
  });

  it("shows 'Not quite' for a wrong build", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("combination-formula");

    for (const v of ["m", "!", "k", "!", "n", "k", "!"]) await tapTile(user, v);

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Not quite")).toBeInTheDocument();
  });
});

describe("handshake-party capstone", () => {
  it("completes when C(5,2) = 10 is entered", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("handshake-party");

    expect(onComplete).not.toHaveBeenCalled();
    await user.type(
      screen.getByRole("textbox", { name: /number of handshakes/i }),
      "10",
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/lesson 4 complete/i)).toBeInTheDocument();
  });

  it("does not complete on a wrong count", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("handshake-party");

    await user.type(
      screen.getByRole("textbox", { name: /number of handshakes/i }),
      "20",
    );

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("two-stories interaction", () => {
  it("completes after building 3 scoops", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("two-stories");

    await user.click(screen.getByRole("button", { name: /vanilla/i }));
    await user.click(screen.getByRole("button", { name: /choc/i }));
    expect(onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /vanilla/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("stars-bars interaction", () => {
  it("completes after placing candies and identifying stars/bars", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("stars-bars");

    // Place all 4 candies into Jar 1.
    const jar1 = screen.getByRole("button", { name: /^Jar 1$/i });
    for (let i = 0; i < 4; i++) await user.click(jar1);

    await user.type(screen.getByRole("textbox", { name: /^stars$/i }), "4");
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(screen.getByRole("textbox", { name: /^bars$/i }), "2");

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("stars-bars-formula interaction (tap to place)", () => {
  async function tapTile(
    user: ReturnType<typeof userEvent.setup>,
    value: string,
  ) {
    const tiles = screen.getAllByRole("button", { name: `tile ${value}` });
    await user.click(tiles[0]);
  }

  it("completes when C(k + n − 1, n − 1) is assembled", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("stars-bars-formula");

    // Slots fill left→right: s1(k) s2(n) s3(1) s4(n) s5(1).
    for (const v of ["k", "n", "1", "n"]) await tapTile(user, v);
    expect(onComplete).not.toHaveBeenCalled();
    await tapTile(user, "1");

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/C\(6, 2\)/i)).toBeInTheDocument();
  });

  it("shows 'Not quite' for a wrong build", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("stars-bars-formula");

    for (const v of ["k", "n", "2", "n", "1"]) await tapTile(user, v);

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Not quite")).toBeInTheDocument();
  });
});

describe("donut-box capstone", () => {
  it("completes when C(5,2) = 10 is entered (n=3, k=3)", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("donut-box");

    expect(onComplete).not.toHaveBeenCalled();
    await user.type(
      screen.getByRole("textbox", { name: /number of possible boxes/i }),
      "10",
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/lesson 5 complete/i)).toBeInTheDocument();
  });

  it("does not complete on a wrong count", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("donut-box");

    await user.type(
      screen.getByRole("textbox", { name: /number of possible boxes/i }),
      "9",
    );

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("crack-the-code capstone", () => {
  it("completes when base, exponent, and count are entered (k=3 → 10³ = 1000)", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("crack-the-code");

    expect(onComplete).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: /options per dial/i }),
      "10",
    );
    await user.type(
      screen.getByRole("textbox", { name: /number of dials \(exponent\)/i }),
      "3",
    );
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(
      screen.getByRole("textbox", { name: /number of possible codes/i }),
      "1000",
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/lesson 3 complete/i)).toBeInTheDocument();
  });

  it("does not complete on the wrong count", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("crack-the-code");

    await user.type(
      screen.getByRole("textbox", { name: /options per dial/i }),
      "10",
    );
    await user.type(
      screen.getByRole("textbox", { name: /number of dials \(exponent\)/i }),
      "3",
    );
    await user.type(
      screen.getByRole("textbox", { name: /number of possible codes/i }),
      "300",
    );

    expect(onComplete).not.toHaveBeenCalled();
  });
});
