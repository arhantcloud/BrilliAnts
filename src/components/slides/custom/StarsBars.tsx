import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";

const JARS = 3;
const CANDIES = 4;

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

export default function StarsBars({ slide, onComplete }: CustomSlideProps) {
  const [counts, setCounts] = useState<number[]>(Array(JARS).fill(0));

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const used = counts.reduce((a, b) => a + b, 0);
  const remaining = CANDIES - used;

  function add(jar: number) {
    if (remaining <= 0) return;
    setCounts((c) => c.map((x, i) => (i === jar ? x + 1 : x)));
  }
  function removeOne(jar: number) {
    setCounts((c) => c.map((x, i) => (i === jar && x > 0 ? x - 1 : x)));
  }

  const total = choose(CANDIES + JARS - 1, JARS - 1);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Stars and bars"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Put {CANDIES} identical candies into {JARS} jars. Tap a jar to add, tap a
        candy to remove. Watch the candies-and-dividers pattern below.
      </p>

      {/* Jars */}
      <div className="mt-5 flex justify-center gap-2.5">
        {counts.map((c, jar) => (
          <div key={jar} className="flex flex-col items-center gap-1">
            <button
              onClick={() => add(jar)}
              disabled={remaining <= 0}
              className="flex h-24 w-20 flex-col-reverse items-center gap-1 rounded-b-2xl rounded-t-md border-2 border-slate-300 bg-slate-50 p-1.5 transition active:scale-95 disabled:opacity-60"
            >
              {Array.from({ length: c }, (_, i) => (
                <span
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOne(jar);
                  }}
                  className="h-4 w-4 animate-pop-in rounded-full bg-pink-400"
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

      {/* Stars and bars encoding */}
      <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
        <p className="text-[12px] font-semibold text-slate-300">
          Stars (candies) and bars (dividers)
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
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
        </div>
        <p className="mt-3 text-center text-[13px] text-slate-300">
          {CANDIES} stars + {JARS - 1} bars. Choosing where the bars go gives{" "}
          <span className="font-bold text-brand-300">
            C({CANDIES + JARS - 1}, {JARS - 1}) = {total}
          </span>{" "}
          distributions.
        </p>
      </div>

      {used > 0 && (
        <button
          onClick={() => setCounts(Array(JARS).fill(0))}
          className="btn-ghost mt-3 w-full"
        >
          Reset
        </button>
      )}
    </div>
  );
}
