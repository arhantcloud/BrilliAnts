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
  "connect-categories",
  "build-podium",
  "select-team",
  "classify-examples",
  "fill-seats",
  "permute-k",
  "permutation-formula",
  "power-explorer",
  "crack-the-code",
  "combination-formula",
  "handshake-party",
  "multiset-build",
  "multiset-distribute",
  "multiset-stars-bars",
  "multiset-formula",
  "multiset-box",
  "distribute-bins",
  "exclusive-bins",
  "map-distribution",
];

describe("custom slides: gated slides do not complete on mount", () => {
  it.each(GATED)("%s does not call onComplete on mount", (component) => {
    const onComplete = renderSlide(component);
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
  });
});

describe("connect-categories matching", () => {
  // Each description connects to exactly one family name.
  const PAIRS: [string, string][] = [
    ["Order matters, No replacement", "Permutations"],
    ["Order matters, With replacement", "Sequences"],
    ["Order doesn't matter, No replacement", "Combinations"],
    ["Order doesn't matter, With replacement", "Multisets"],
  ];

  it("completes only after every description is matched correctly", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("connect-categories");

    for (let i = 0; i < PAIRS.length; i++) {
      const [desc, name] = PAIRS[i];
      await user.click(screen.getByRole("button", { name: desc }));
      await user.click(screen.getByRole("button", { name }));
      // Not complete until the final correct connection lands.
      if (i < PAIRS.length - 1) {
        expect(onComplete).not.toHaveBeenCalled();
      }
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/all four matched/i)).toBeInTheDocument();
  });

  it("does not complete while any match is wrong", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("connect-categories");

    // Connect one description to the wrong family.
    await user.click(
      screen.getByRole("button", { name: "Order matters, No replacement" }),
    );
    await user.click(screen.getByRole("button", { name: "Combinations" }));

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("select-team: pick a team, lock it, then order it", () => {
  it("does not complete before three are chosen", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("select-team");

    await user.click(screen.getByRole("button", { name: /^ana$/i }));
    await user.click(screen.getByRole("button", { name: /^cy$/i }));

    expect(onComplete).not.toHaveBeenCalled();
    // Ordering phase is hidden until the team is locked.
    expect(
      screen.queryByRole("button", { name: /add ordering/i }),
    ).not.toBeInTheDocument();
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

  it("shows 'Not quite' for a wrong build", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("combination-formula");

    for (const v of ["m", "!", "k", "!", "n", "k", "!"]) await tapTile(user, v);

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Not quite")).toBeInTheDocument();
  });
});

describe("multiset-build interaction", () => {
  it("completes after building a full cup of 3 scoops", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("multiset-build");

    await user.click(screen.getByRole("button", { name: /add vanilla/i }));
    await user.click(screen.getByRole("button", { name: /add choc/i }));
    expect(onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /add vanilla/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("multiset-distribute interaction", () => {
  it("completes once both movable friends are seated in the line", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("multiset-distribute");

    await user.click(screen.getByRole("button", { name: /place ben/i }));
    await user.click(screen.getByRole("button", { name: /^position 1$/i }));
    // Only one friend seated so far, not complete yet.
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /place cam/i }));
    await user.click(screen.getByRole("button", { name: /^position 4$/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/choice of spots/i)).toBeInTheDocument();
  });

  it("does not complete on mount or after seating only one friend", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("multiset-distribute");

    expect(onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /place ben/i }));
    await user.click(screen.getByRole("button", { name: /^position 3$/i }));

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("multiset-stars-bars interaction", () => {
  it("completes after the split and the combination count", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("multiset-stars-bars");

    // The scoops/bars question only appears after both bars are placed.
    await user.click(screen.getByRole("button", { name: /^location 2$/i }));
    expect(
      screen.queryByRole("textbox", { name: /^scoops$/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^location 5$/i }));

    await user.type(screen.getByRole("textbox", { name: /^scoops$/i }), "4");
    await user.type(screen.getByRole("textbox", { name: /^bars$/i }), "2");

    // The combination step appears; completion waits for C(6, 2).
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(
      screen.getByRole("textbox", { name: /^total spots$/i }),
      "6",
    );
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(screen.getByRole("textbox", { name: /^wafers$/i }), "2");

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/towers result/i)).toHaveTextContent("15");
  });

  it("does not complete with a wrong split count", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("multiset-stars-bars");

    await user.click(screen.getByRole("button", { name: /^location 1$/i }));
    await user.click(screen.getByRole("button", { name: /^location 4$/i }));
    await user.type(screen.getByRole("textbox", { name: /^scoops$/i }), "5");
    await user.type(screen.getByRole("textbox", { name: /^bars$/i }), "2");

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("multiset-formula interaction", () => {
  it("completes after naming the pieces and filling the combination", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("multiset-formula");

    // The combination only appears once both pieces are named in variables.
    await user.type(
      screen.getByRole("textbox", { name: /scoops in variables/i }),
      "k",
    );
    expect(
      screen.queryByRole("textbox", { name: /combination first part/i }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: /wafers in variables/i }),
      "n-1",
    );

    expect(onComplete).not.toHaveBeenCalled();
    await user.type(
      screen.getByRole("textbox", { name: /combination first part/i }),
      "k+n-1",
    );
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(
      screen.getByRole("textbox", { name: /combination second part/i }),
      "n-1",
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not complete with a wrong combination", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("multiset-formula");

    await user.type(
      screen.getByRole("textbox", { name: /scoops in variables/i }),
      "k",
    );
    await user.type(
      screen.getByRole("textbox", { name: /wafers in variables/i }),
      "n-1",
    );
    await user.type(
      screen.getByRole("textbox", { name: /combination first part/i }),
      "k+n",
    );
    await user.type(
      screen.getByRole("textbox", { name: /combination second part/i }),
      "n-1",
    );

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("multiset-box capstone", () => {
  it("completes after filling C(5, 2) = 10 (n=3, k=3)", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("multiset-box");

    // The count box only appears once both combination args are correct.
    await user.type(
      screen.getByRole("textbox", { name: /combination top/i }),
      "5",
    );
    expect(
      screen.queryByRole("textbox", { name: /number of possible boxes/i }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: /combination bottom/i }),
      "2",
    );

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
    const onComplete = renderSlide("multiset-box");

    await user.type(
      screen.getByRole("textbox", { name: /combination top/i }),
      "5",
    );
    await user.type(
      screen.getByRole("textbox", { name: /combination bottom/i }),
      "2",
    );
    await user.type(
      screen.getByRole("textbox", { name: /number of possible boxes/i }),
      "9",
    );

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("distribute-bins: password vs pizza", () => {
  it("hides the matching gate until the learner views the pizza", () => {
    renderSlide("distribute-bins");
    expect(
      screen.queryByRole("button", { name: "Distinguishable" }),
    ).not.toBeInTheDocument();
  });

  it("completes after viewing the pizza and matching both pairs", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("distribute-bins");

    await user.click(screen.getByRole("button", { name: /make balls identical/i }));
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Order matters" }));
    await user.click(screen.getByRole("button", { name: "Distinguishable" }));
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Order doesn’t matter" }));
    await user.click(screen.getByRole("button", { name: "Indistinguishable" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/order matters ⇄ distinguishable/i),
    ).toBeInTheDocument();
  });

  it("does not complete when a pair is matched wrong", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("distribute-bins");

    await user.click(screen.getByRole("button", { name: /make balls identical/i }));
    await user.click(screen.getByRole("button", { name: "Order matters" }));
    await user.click(screen.getByRole("button", { name: "Indistinguishable" }));

    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("exclusive-bins: repeats vs exclusive", () => {
  it("hides the matching gate until the learner views the exclusive rule", () => {
    renderSlide("exclusive-bins");
    expect(
      screen.queryByRole("button", { name: "Exclusive" }),
    ).not.toBeInTheDocument();
  });

  it("completes after going exclusive and matching both pairs", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("exclusive-bins");

    await user.click(screen.getByRole("button", { name: /make bins exclusive/i }));
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Repeats allowed" }));
    await user.click(screen.getByRole("button", { name: "Not exclusive" }));
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "No repeats" }));
    await user.click(screen.getByRole("button", { name: "Exclusive" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/no repeats ⇄ exclusive/i)).toBeInTheDocument();
  });

  it("does not complete when a pair is matched wrong", async () => {
    const user = userEvent.setup();
    const onComplete = renderSlide("exclusive-bins");

    await user.click(screen.getByRole("button", { name: /make bins exclusive/i }));
    await user.click(screen.getByRole("button", { name: "Repeats allowed" }));
    await user.click(screen.getByRole("button", { name: "Exclusive" }));

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
