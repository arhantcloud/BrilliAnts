import { useState } from "react";
import type { CustomSlideProps } from "./registry";
import { Stepper } from "./ui";

function factorial(n: number): number {
  let acc = 1;
  for (let i = 2; i <= n; i++) acc *= i;
  return acc;
}

export default function PermuteK({ slide, onComplete }: CustomSlideProps) {
  const [n, setN] = useState(5);
  const [k, setK] = useState(3);
  const [totalInput, setTotalInput] = useState(""); // number in front of total factorial → n
  const [tailInput, setTailInput] = useState(""); // number in front of tail factorial → n-k
  const [resultInput, setResultInput] = useState(""); // value it equals
  const [solved, setSolved] = useState(false);

  // Full factorial N × (N-1) × … × 1; first k kept, last (N-k) cut off.
  const factors = Array.from({ length: n }, (_, i) => n - i);
  const tailCount = n - k;

  const result = factorial(n) / factorial(tailCount); // = product of the kept k choices

  const totalCorrect = totalInput.trim() !== "" && Number(totalInput) === n;
  const tailCorrect = tailInput.trim() !== "" && Number(tailInput) === tailCount;
  const resultCorrect =
    resultInput.trim() !== "" && Number(resultInput) === result;

  function maybeSolve(total: boolean, tail: boolean, res: boolean) {
    if (total && tail && res && !solved) {
      setSolved(true);
      onComplete();
    }
  }

  function clearInputs() {
    if (!solved) {
      setTotalInput("");
      setTailInput("");
      setResultInput("");
    }
  }

  function changeN(v: number) {
    setN(v);
    if (v < k) setK(v);
    clearInputs();
  }

  function changeK(v: number) {
    setK(v);
    clearInputs();
  }

  function onTotal(raw: string) {
    if (solved) return;
    const digits = raw.replace(/\D/g, "").slice(0, 1);
    setTotalInput(digits);
    maybeSolve(digits !== "" && Number(digits) === n, tailCorrect, resultCorrect);
  }

  function onTail(raw: string) {
    if (solved) return;
    const digits = raw.replace(/\D/g, "").slice(0, 1);
    setTailInput(digits);
    maybeSolve(
      totalCorrect,
      digits !== "" && Number(digits) === tailCount,
      resultCorrect,
    );
  }

  function onResult(raw: string) {
    if (solved) return;
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setResultInput(digits);
    maybeSolve(
      totalCorrect,
      tailCorrect,
      digits !== "" && Number(digits) === result,
    );
  }

  const inputClass = (filled: boolean, correct: boolean, width: string) =>
    `${width} rounded-lg px-2 py-1 text-center text-2xl font-extrabold outline-none transition ${
      correct
        ? "bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400"
        : filled
          ? "bg-red-400/10 text-red-300 ring-2 ring-red-400"
          : "bg-white/10 text-brand-200 ring-2 ring-white/20 focus:ring-brand-300"
    }`;

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Pick k of n"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
        Out of <b>{n}</b> race cars, how many possible podiums are there for the
        top <b>{k}</b> finishers, picking <b>{k}</b> of <b>{n}</b>?
      </p>

      {/* Two steppers: cars and podium spots. */}
      <div className="mt-5 flex justify-center gap-8">
        <Stepper label="cars (n)" value={n} min={2} max={5} onChange={changeN} />
        <Stepper label="podium (k)" value={k} min={1} max={n} onChange={changeK} />
      </div>

      {/* Full factorial chain inside a colored "total" box; tail cut off after k. */}
      <div className="mt-6 rounded-2xl border-2 border-brand-300 bg-brand-50 p-4">
        <div className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
          total
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-3">
          {factors.map((f, i) => {
            const isKept = i < k;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold transition-all duration-300 ${
                    isKept
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-rose-100 text-rose-300 line-through"
                  }`}
                >
                  {f}
                </div>
                {i < n - 1 && (
                  <span
                    className={`text-base font-bold transition ${
                      i < k - 1 ? "text-brand-400" : "text-rose-300"
                    }`}
                  >
                    ×
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-6 text-[11px] font-bold uppercase tracking-wide">
        <span className="text-brand-500">● kept choices</span>
        <span className="text-rose-400">● cut tail</span>
      </div>

      {/* Division readout: fill in the numbers in front of each factorial,
          and what the whole thing equals. */}
      <div className="mt-5 rounded-2xl bg-stone-900 p-5 text-white">
        <div className="flex flex-wrap items-end justify-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-brand-300">
              total
            </span>
            <div className="flex items-end gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                aria-label="number in front of the total factorial"
                value={totalInput}
                onChange={(e) => onTotal(e.target.value)}
                placeholder="?"
                disabled={solved}
                className={inputClass(totalInput.trim() !== "", totalCorrect, "w-14")}
              />
              <span className="pb-1 text-2xl font-extrabold">!</span>
            </div>
          </div>

          <span className="pb-2 text-3xl font-extrabold text-stone-500">÷</span>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-rose-300">
              tail
            </span>
            <div className="flex items-end gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                aria-label="number in front of the tail factorial"
                value={tailInput}
                onChange={(e) => onTail(e.target.value)}
                placeholder="?"
                disabled={solved}
                className={inputClass(tailInput.trim() !== "", tailCorrect, "w-14")}
              />
              <span className="pb-1 text-2xl font-extrabold">!</span>
            </div>
          </div>

          <span className="pb-2 text-2xl font-extrabold">=</span>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-brand-300">
              answer
            </span>
            <input
              type="text"
              inputMode="numeric"
              aria-label="value it equals"
              value={resultInput}
              onChange={(e) => onResult(e.target.value)}
              placeholder="?"
              disabled={solved}
              className={inputClass(resultInput.trim() !== "", resultCorrect, "w-24")}
            />
          </div>
        </div>

        <p className="mt-3 text-center text-[13px] text-stone-300">
          {solved
            ? `${result.toLocaleString()} possible podiums, picking ${k} of ${n} cars in order.`
            : "Write the number in front of each factorial, then what it all equals."}
        </p>
      </div>
    </div>
  );
}
