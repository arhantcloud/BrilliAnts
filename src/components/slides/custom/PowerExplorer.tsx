import { useEffect, useState } from "react";
import type { CustomSlideProps } from "./registry";
import { Readout, Stepper } from "./ui";

export default function PowerExplorer({ slide, onComplete }: CustomSlideProps) {
  const [n, setN] = useState(4);
  const [k, setK] = useState(3);

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const value = n ** k;
  const terms = Array(k).fill(n);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "n to the k"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        With <b>n</b> choices at each of <b>k</b> positions, multiply n by itself
        k times: <b>nᵏ</b>. Try different values.
      </p>

      <div className="mt-5 flex items-center justify-center gap-6">
        <Stepper label="n choices" value={n} min={2} max={9} onChange={setN} />
        <Stepper label="k slots" value={k} min={1} max={6} onChange={setK} />
      </div>

      {/* k slots, each showing n choices */}
      <div className="mt-5 flex flex-wrap justify-center gap-1.5">
        {terms.map((_, i) => (
          <div
            key={i}
            className="flex h-11 w-11 flex-col items-center justify-center rounded-lg border-2 border-brand-200 bg-brand-50"
          >
            <span className="text-sm font-extrabold text-brand-600">{n}</span>
          </div>
        ))}
      </div>

      <Readout>
        <p key={`${n}-${k}`} className="animate-fade-in text-xl font-extrabold tracking-wide">
          {n}
          <sup>{k}</sup> = {terms.join(" × ")}{" "}
          <span className="text-brand-300">= {value.toLocaleString()}</span>
        </p>
        <p className="mt-2 text-[13px] text-slate-300">
          {k} independent choices, {n} options each.
        </p>
      </Readout>
    </div>
  );
}
