import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const JARS = 2;
const CANDIES = 2;
const TARGET = [1, 1];

export default function DistributeBuild({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [counts, setCounts] = useState<number[]>(Array(JARS).fill(0));
  const [solved, setSolved] = useState(false);

  const used = counts.reduce((a, b) => a + b, 0);
  const remaining = CANDIES - used;
  const full = used === CANDIES;
  const isCorrect = full && counts.every((c, i) => c === TARGET[i]);

  function add(jar: number) {
    if (solved || remaining <= 0) return;
    const next = counts.map((x, i) => (i === jar ? x + 1 : x));
    setCounts(next);
    if (
      next.reduce((a, b) => a + b, 0) === CANDIES &&
      next.every((c, i) => c === TARGET[i])
    ) {
      setSolved(true);
      onComplete();
    }
  }
  function removeOne(jar: number) {
    if (solved) return;
    setCounts((c) => c.map((x, i) => (i === jar && x > 0 ? x - 1 : x)));
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Make the distribution"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Put 2 candies into 2 jars so that <b>each jar has exactly one</b>. Tap a
        jar to add a candy, tap a candy to remove it.
      </p>

      <div className="mt-5 flex justify-center gap-4">
        {counts.map((c, jar) => (
          <div key={jar} className="flex flex-col items-center gap-1">
            <button
              onClick={() => add(jar)}
              disabled={solved || remaining <= 0}
              className="flex h-28 w-24 flex-col-reverse items-center gap-1 rounded-b-2xl rounded-t-md border-2 border-slate-300 bg-slate-50 p-2 transition active:scale-95 disabled:opacity-60"
            >
              {Array.from({ length: c }, (_, i) => (
                <span
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOne(jar);
                  }}
                  className="h-5 w-5 animate-pop-in rounded-full bg-pink-400"
                />
              ))}
            </button>
            <span className="text-[11px] font-bold text-slate-400">
              Jar {jar + 1}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[12px] font-semibold text-slate-400">
        {remaining} candies left to place
      </p>

      {/* Encoding */}
      <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 p-3 text-white">
        {counts.map((c, jar) => (
          <span key={jar} className="flex items-center gap-1.5">
            {Array.from({ length: c }, (_, i) => (
              <span key={i} className="h-3.5 w-3.5 rounded-full bg-pink-400" />
            ))}
            {jar < JARS - 1 && (
              <span className="mx-1 h-6 w-1 rounded bg-amber-300" />
            )}
          </span>
        ))}
        {used === 0 && <span className="text-xs text-slate-500">empty</span>}
      </div>

      {full && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            isCorrect
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-bold">
            {isCorrect ? "Correct!" : "Not quite — try again"}
          </p>
          <p className="mt-0.5">
            {isCorrect
              ? "One candy in each jar: the pattern ★ | ★. Candies are identical, so only the counts matter."
              : "Both candies went to one jar. Spread them out: one each."}
          </p>
        </div>
      )}

      {full && !solved && (
        <button
          onClick={() => setCounts(Array(JARS).fill(0))}
          className="btn-primary mt-3 w-full"
        >
          Try again
        </button>
      )}
    </div>
  );
}
