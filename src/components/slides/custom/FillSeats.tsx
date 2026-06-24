import { useEffect, useState } from "react";
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

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const remaining = PEOPLE.filter((p) => !seated.includes(p.id));
  const activeSeat = seated.length; // index of next empty seat
  const done = seated.length === N;

  function place(id: string) {
    if (seated.includes(id) || done) return;
    setSeated((s) => [...s, id]);
  }

  // Choice counts used so far: N, N-1, ... for each filled seat.
  const terms = seated.map((_, i) => N - i);
  const product = terms.reduce((a, b) => a * b, 1);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Fill the seats"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Seat these 4 friends in a row. Tap a friend to take the next seat — watch
        how the number of choices shrinks each time.
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
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 transition ${
                  person
                    ? "border-transparent"
                    : isActive
                      ? "border-brand-400 bg-brand-50"
                      : "border-dashed border-slate-200 bg-slate-50"
                }`}
              >
                {person ? (
                  <div
                    className={`flex h-14 w-14 animate-pop-in flex-col items-center justify-center rounded-xl text-white ${person.color}`}
                  >
                    <span className="text-sm font-bold">{person.name}</span>
                  </div>
                ) : isActive ? (
                  <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {N - seated.length} choices
                  </span>
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

      {/* Running product */}
      <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
        {seated.length === 0 ? (
          <p className="text-sm text-slate-400">
            Seat 1 has {N} choices. Tap a friend to begin.
          </p>
        ) : (
          <>
            <p className="text-2xl font-extrabold tracking-wide">
              {terms.join(" × ")}
              {!done && <span className="text-slate-500"> × …</span>}
              {done && (
                <span className="text-brand-300"> = {product}</span>
              )}
            </p>
            <p className="mt-2 text-[13px] text-slate-300">
              {done
                ? `${product} different ways to seat 4 friends — that's 4!`
                : `Seat ${activeSeat + 1} now has ${N - seated.length} choices left.`}
            </p>
          </>
        )}
      </div>

      {seated.length > 0 && (
        <button
          onClick={() => setSeated([])}
          className="btn-ghost mt-3 w-full"
        >
          Reset
        </button>
      )}
    </div>
  );
}
