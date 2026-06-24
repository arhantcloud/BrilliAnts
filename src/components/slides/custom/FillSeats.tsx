import { useState } from "react";
import type { CustomSlideProps } from "./registry";

type Person = { id: string; name: string; color: string };

const PEOPLE: Person[] = [
  { id: "ava", name: "Ava", color: "bg-rose-400" },
  { id: "ben", name: "Ben", color: "bg-sky-400" },
  { id: "cy", name: "Cy", color: "bg-amber-400" },
  { id: "dee", name: "Dee", color: "bg-violet-400" },
];

const N = PEOPLE.length;

export default function FillSeats({ slide, onComplete }: CustomSlideProps) {
  const [seated, setSeated] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState(false);

  const remaining = PEOPLE.filter((p) => !seated.includes(p.id));
  const activeSeat = seated.length; // index of next empty seat
  const done = seated.length === N;

  // Choice counts used so far: N, N-1, ... for each filled seat.
  const terms = seated.map((_, i) => N - i);
  const product = terms.reduce((a, b) => a * b, 1);
  const answerNum = Number(answer);
  const answerCorrect =
    done && answer.trim() !== "" && answerNum === product;

  function place(id: string) {
    if (seated.includes(id) || done || solved) return;
    setSeated((s) => [...s, id]);
  }

  function onAnswerChange(raw: string) {
    if (solved) return;
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    setAnswer(digits);
    if (done && digits !== "" && Number(digits) === product) {
      setSolved(true);
      onComplete();
    }
  }

  function reset() {
    if (solved) return;
    setSeated([]);
    setAnswer("");
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Fill the seats"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Seat these 4 friends in a row. Tap a friend to take the next seat — the
        seat shows how many choices you have, and it shrinks each time.
      </p>

      {/* Seats */}
      <div className="mt-5 flex justify-center gap-2">
        {Array.from({ length: N }, (_, i) => {
          const personId = seated[i];
          const person = PEOPLE.find((p) => p.id === personId);
          const isActive = i === activeSeat;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">
                Seat {i + 1}
              </span>
              <div
                className={`h-16 w-16 overflow-hidden rounded-2xl border-2 transition ${
                  person
                    ? "border-transparent"
                    : isActive
                      ? "border-brand-500"
                      : "border-dashed border-slate-200 bg-slate-50"
                }`}
              >
                {person ? (
                  <div
                    className={`flex h-full w-full animate-pop-in flex-col items-center justify-center text-white ${person.color}`}
                  >
                    <span className="text-sm font-bold">{person.name}</span>
                  </div>
                ) : isActive ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-brand-500 text-white">
                    <span className="text-3xl font-extrabold leading-none">
                      {N - seated.length}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wide text-brand-100">
                      choices
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pool */}
      <div className="mt-5 flex min-h-[56px] flex-wrap items-center justify-center gap-2.5">
        {remaining.map((p) => (
          <button
            key={p.id}
            onClick={() => place(p.id)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm transition active:scale-95 ${p.color}`}
          >
            {p.name}
          </button>
        ))}
        {remaining.length === 0 && (
          <span className="text-sm font-semibold text-emerald-600">
            Everyone is seated!
          </span>
        )}
      </div>

      {/* Running product — the learner fills in the total. */}
      <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
        {seated.length === 0 ? (
          <p className="text-sm text-slate-400">
            Seat 1 has {N} choices. Tap a friend to begin.
          </p>
        ) : (
          <>
            <p className="flex flex-wrap items-center justify-center gap-2 text-2xl font-extrabold tracking-wide">
              <span>{terms.join(" × ")}</span>
              {!done && <span className="text-slate-500">× …</span>}
              {done && (
                <>
                  <span>=</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="total number of arrangements"
                    value={answer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    placeholder="?"
                    disabled={solved}
                    className={`w-20 rounded-lg px-2 py-1 text-center text-2xl font-extrabold outline-none transition ${
                      answerCorrect
                        ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
                        : answer.trim() !== ""
                          ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
                          : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
                    }`}
                  />
                </>
              )}
            </p>
            <p className="mt-2 text-[13px] text-slate-300">
              {solved
                ? `${product} different ways to seat 4 friends — that's 4!`
                : done
                  ? answer.trim() === ""
                    ? "Now multiply it out and fill in the total."
                    : answerCorrect
                      ? ""
                      : "Not quite — multiply 4 × 3 × 2 × 1."
                  : `Seat ${activeSeat + 1} now has ${N - seated.length} choices left.`}
            </p>
          </>
        )}
      </div>

      {seated.length > 0 && !solved && (
        <button onClick={reset} className="btn-ghost mt-3 w-full">
          Reset
        </button>
      )}
    </div>
  );
}
