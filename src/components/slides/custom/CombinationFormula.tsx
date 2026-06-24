import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";
import { Readout, Stepper } from "./ui";

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

export default function CombinationFormula({
  slide,
  onComplete,
}: CustomSlideProps) {
  const [n, setN] = useState(5);
  const [k, setK] = useState(3);

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const kk = Math.min(k, n);
  const orderedTerms = Array.from({ length: kk }, (_, i) => n - i);
  const ordered = orderedTerms.reduce((a, b) => a * b, 1);
  const kFact = factorial(kk);
  const combo = ordered / kFact;

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Divide out the orderings"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Count the ordered picks, then divide by <b>k!</b> — the number of ways
        each chosen group could have been ordered. That gives{" "}
        <b>C(n, k)</b>.
      </p>

      <div className="mt-5 flex items-center justify-center gap-6">
        <Stepper
          label="n items"
          value={n}
          min={2}
          max={9}
          onChange={(v) => {
            setN(v);
            if (k > v) setK(v);
          }}
        />
        <Stepper
          label="k chosen"
          value={kk}
          min={1}
          max={n}
          onChange={setK}
        />
      </div>

      <Readout>
        <div key={`${n}-${kk}`} className="animate-fade-in space-y-1.5">
          <p className="text-[15px] text-slate-300">
            Ordered: {orderedTerms.join(" × ")} ={" "}
            <span className="font-bold text-white">{ordered.toLocaleString()}</span>
          </p>
          <p className="text-[15px] text-slate-300">
            Divide by {kk}! ={" "}
            <span className="font-bold text-white">{kFact}</span>
          </p>
          <p className="pt-1 text-2xl font-extrabold">
            C({n}, {kk}) ={" "}
            <span className="text-emerald-300">{combo.toLocaleString()}</span>
          </p>
        </div>
      </Readout>
    </div>
  );
}
