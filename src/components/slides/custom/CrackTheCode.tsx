import { useState } from "react";
import type { CustomSlideProps } from "./registry";

const N = 10; // each dial shows a digit 0–9
const MIN_K = 2;
const MAX_K = 6;

export default function CrackTheCode({ slide, onComplete }: CustomSlideProps) {
  const [k, setK] = useState(3);
  const [baseInput, setBaseInput] = useState("");
  const [expInput, setExpInput] = useState("");
  const [resultInput, setResultInput] = useState("");
  const [solved, setSolved] = useState(false);
  const [lockedCode, setLockedCode] = useState<number[]>([]);

  const combos = N ** k;
  const baseCorrect = baseInput.trim() !== "" && Number(baseInput) === N;
  const expCorrect = expInput.trim() !== "" && Number(expInput) === k;
  const resultCorrect =
    resultInput.trim() !== "" && Number(resultInput) === combos;

  function maybeSolve(b: boolean, e: boolean, r: boolean) {
    if (b && e && r && !solved) {
      setLockedCode(
        Array.from({ length: k }, () => Math.floor(Math.random() * N)),
      );
      setSolved(true);
      onComplete();
    }
  }

  function changeK(v: number) {
    if (solved) return;
    setK(v);
    setBaseInput("");
    setExpInput("");
    setResultInput("");
  }

  function onBase(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 2);
    setBaseInput(d);
    maybeSolve(d !== "" && Number(d) === N, expCorrect, resultCorrect);
  }

  function onExp(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 1);
    setExpInput(d);
    maybeSolve(baseCorrect, d !== "" && Number(d) === k, resultCorrect);
  }

  function onResult(raw: string) {
    if (solved) return;
    const d = raw.replace(/\D/g, "").slice(0, 8);
    setResultInput(d);
    maybeSolve(baseCorrect, expCorrect, d !== "" && Number(d) === combos);
  }

  const inputClass = (filled: boolean, correct: boolean, width: string) =>
    `${width} rounded-lg px-1 py-1 text-center font-extrabold outline-none transition ${
      correct
        ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
        : filled
          ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
          : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
    }`;

  return (
    <div>
      <div className="inline-block rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-brand-700">
        Lesson 3 · Final challenge
      </div>
      <h2 className="mt-2 text-xl font-extrabold leading-tight">
        {slide.title ?? "Crack the code"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        A combination padlock has <b>k</b> spinning dials, each showing a digit{" "}
        <b>0–9</b> (ten options, and digits can repeat). How many secret codes
        could it hide? Set the dials, then lock it in.
      </p>

      {/* Dial count */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          onClick={() => changeK(Math.max(MIN_K, k - 1))}
          disabled={solved || k <= MIN_K}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
        >
          −
        </button>
        <div className="flex min-w-[64px] flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            dials (k)
          </span>
          <span className="text-3xl font-extrabold text-brand-600">{k}</span>
        </div>
        <button
          onClick={() => changeK(Math.min(MAX_K, k + 1))}
          disabled={solved || k >= MAX_K}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 transition active:scale-90 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* The padlock */}
      <div className="mx-auto mt-5 w-fit rounded-3xl bg-gradient-to-b from-slate-700 to-slate-900 p-4 shadow-2xl ring-1 ring-black/20">
        <div className="mb-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: k }, (_, i) => (
            <LockDial
              key={i}
              duration={`${2.6 + i * 0.3}s`}
              digit={lockedCode[i] ?? 0}
              solved={solved}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              solved ? "bg-emerald-400" : "animate-pulse bg-amber-400"
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {solved ? "Locked" : "Spinning"}
          </span>
        </div>
      </div>

      {/* Readout — fill in the base, exponent, and the count */}
      <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-center text-white">
        <div className="flex flex-wrap items-start justify-center gap-2">
          <div className="flex items-start">
            {solved ? (
              <span className="text-2xl font-extrabold">{N}</span>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                aria-label="options per dial"
                value={baseInput}
                onChange={(e) => onBase(e.target.value)}
                placeholder="?"
                className={`text-2xl ${inputClass(baseInput.trim() !== "", baseCorrect, "w-14")}`}
              />
            )}
            <div className="ml-0.5 -mt-1.5">
              {solved ? (
                <span className="text-base font-extrabold">{k}</span>
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="number of dials (exponent)"
                  value={expInput}
                  onChange={(e) => onExp(e.target.value)}
                  placeholder="?"
                  className={`text-base ${inputClass(expInput.trim() !== "", expCorrect, "w-9")}`}
                />
              )}
            </div>
          </div>

          <span className="self-center text-2xl font-extrabold">=</span>

          {solved ? (
            <span className="self-center text-2xl font-extrabold text-brand-300">
              {combos.toLocaleString()}
            </span>
          ) : (
            <input
              type="text"
              inputMode="numeric"
              aria-label="number of possible codes"
              value={resultInput}
              onChange={(e) => onResult(e.target.value)}
              placeholder="?"
              className={`text-2xl ${inputClass(resultInput.trim() !== "", resultCorrect, "w-32")}`}
            />
          )}
        </div>
      </div>

      {/* Celebratory reveal */}
      {solved && (
        <div className="mt-4 animate-fade-in-up">
          <GrowthChart upTo={k} />
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-bold">Lesson 3 complete</p>
            <p className="mt-0.5">
              Add one dial and the codes jump <b>×{N}</b>. That runaway growth is{" "}
              <b>
                n<sup>k</sup>
              </b>{" "}
              in action — the signature of <i>order matters, with reuse</i>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function GrowthChart({ upTo }: { upTo: number }) {
  // One bar per dial count; height grows by order of magnitude so the
  // exponential explosion reads clearly.
  const ks = Array.from({ length: upTo }, (_, i) => i + 1);
  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-white p-4">
      <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Codes per number of dials
      </p>
      <div className="flex items-end justify-center gap-3">
        {ks.map((kk) => {
          const isLast = kk === upTo;
          return (
            <div key={kk} className="flex flex-col items-center gap-1">
              <span
                className={`text-[10px] font-bold ${
                  isLast ? "text-brand-600" : "text-slate-400"
                }`}
              >
                {(10 ** kk).toLocaleString()}
              </span>
              <div
                className={`w-7 rounded-t transition-all ${
                  isLast ? "bg-brand-500" : "bg-brand-200"
                }`}
                style={{ height: `${10 + kk * 16}px` }}
              />
              <span className="text-[10px] font-bold text-slate-500">{kk}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LockDial({
  duration,
  digit,
  solved,
}: {
  duration: string;
  digit: number;
  solved: boolean;
}) {
  if (solved) {
    return (
      <div className="flex h-12 w-9 items-center justify-center rounded-md bg-gradient-to-b from-slate-100 to-slate-300 text-2xl font-extrabold text-slate-900 ring-1 ring-slate-500">
        {digit}
      </div>
    );
  }
  const strip = Array.from({ length: N }, (_, i) => i);
  return (
    <div className="h-12 w-9 overflow-hidden rounded-md bg-gradient-to-b from-slate-200 to-slate-400 shadow-inner ring-1 ring-slate-500">
      <div
        className="flex animate-reel flex-col items-center"
        style={{ animationDuration: duration }}
      >
        {[...strip, ...strip].map((d, i) => (
          <span
            key={i}
            className="flex h-12 w-9 items-center justify-center text-2xl font-extrabold text-slate-800"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
