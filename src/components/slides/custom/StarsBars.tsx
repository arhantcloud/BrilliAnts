import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const JARS = 3;
const CANDIES = 4;

export default function StarsBars({ slide, onComplete }: CustomSlideProps) {
  const [counts, setCounts] = useState<number[]>(Array(JARS).fill(0));
  const [starsInput, setStarsInput] = useState("");
  const [barsInput, setBarsInput] = useState("");
  const [solved, setSolved] = useState(false);

  const used = counts.reduce((a, b) => a + b, 0);
  const remaining = CANDIES - used;
  const allPlaced = used === CANDIES;

  const starsCorrect = starsInput.trim() !== "" && Number(starsInput) === CANDIES;
  const barsCorrect = barsInput.trim() !== "" && Number(barsInput) === JARS - 1;

  function maybeSolve(s: boolean, b: boolean) {
    if (allPlaced && s && b && !solved) {
      setSolved(true);
      onComplete();
    }
  }

  function add(jar: number) {
    if (solved || remaining <= 0) return;
    setCounts((c) => c.map((x, i) => (i === jar ? x + 1 : x)));
  }
  function removeOne(jar: number) {
    if (solved) return;
    setCounts((c) => c.map((x, i) => (i === jar && x > 0 ? x - 1 : x)));
  }
  function onStars(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 2);
    setStarsInput(d);
    maybeSolve(d !== "" && Number(d) === CANDIES, barsCorrect);
  }
  function onBars(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 2);
    setBarsInput(d);
    maybeSolve(starsCorrect, d !== "" && Number(d) === JARS - 1);
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Stars and bars"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Put {CANDIES} identical candies into {JARS} jars (a jar can be empty). Tap
        a jar to add, tap a candy to remove. Watch the row of stars and dividers
        below.
      </p>

      {/* Jars */}
      <div className="mt-5 flex justify-center gap-2.5">
        {counts.map((c, jar) => (
          <div key={jar} className="flex flex-col items-center gap-1">
            <button
              onClick={() => add(jar)}
              disabled={solved || remaining <= 0}
              aria-label={`Jar ${jar + 1}`}
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
        {remaining > 0 ? `${remaining} candies left to place` : "all placed"}
      </p>

      {/* Stars and bars encoding */}
      <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
        <p className="text-center text-[12px] font-semibold text-slate-300">
          ★ = candy · | = divider between jars
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {counts.map((c, jar) => (
            <span key={jar} className="flex items-center gap-1.5">
              {Array.from({ length: c }, (_, i) => (
                <span key={i} className="text-xl text-pink-400">
                  ★
                </span>
              ))}
              {jar < JARS - 1 && (
                <span className="mx-1 h-6 w-1 rounded bg-amber-300" />
              )}
            </span>
          ))}
        </div>

        {allPlaced && (
          <div className="mt-4 animate-fade-in border-t border-white/10 pt-3">
            <div className="flex flex-wrap items-end justify-center gap-3">
              <Field
                label="stars"
                value={starsInput}
                onChange={onStars}
                correct={starsCorrect}
                solved={solved}
              />
              <Field
                label="bars"
                value={barsInput}
                onChange={onBars}
                correct={barsCorrect}
                solved={solved}
              />
            </div>
            <p className="mt-3 text-center text-[13px] text-slate-300">
              {solved
                ? `Always ${CANDIES} stars and ${JARS - 1} bars — every distribution just rearranges them.`
                : "How many stars, and how many bars (dividers between jars)?"}
            </p>
          </div>
        )}
      </div>

      {used > 0 && !solved && (
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

function Field({
  label,
  value,
  onChange,
  correct,
  solved,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  correct: boolean;
  solved: boolean;
}) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        disabled={solved}
        className={`w-14 rounded-lg px-1 py-1 text-center text-2xl font-extrabold outline-none transition ${
          correct
            ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
            : value.trim() !== ""
              ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
              : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
        }`}
      />
    </span>
  );
}
