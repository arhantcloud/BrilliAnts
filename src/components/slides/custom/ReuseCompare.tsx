import { useEffect } from "react";
import type { CustomSlideProps } from "./registry";

const N = 4;
const K = 3;

export default function ReuseCompare({ slide, onComplete }: CustomSlideProps) {
  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const withReuse = Array.from({ length: K }, () => N); // 4,4,4
  const noReuse = Array.from({ length: K }, (_, i) => N - i); // 4,3,2
  const withVal = withReuse.reduce((a, b) => a * b, 1);
  const noVal = noReuse.reduce((a, b) => a * b, 1);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">
        {slide.title ?? "Why reuse counts more"}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
        Same {N} items, same {K} slots. The only difference: can you reuse? With
        reuse, the choices never shrink.
      </p>

      <div className="mt-5 space-y-3">
        <CompareRow
          title="With reuse (sequence)"
          terms={withReuse}
          value={withVal}
          accent="text-brand-600"
          chip="bg-brand-500"
        />
        <CompareRow
          title="No reuse (permutation)"
          terms={noReuse}
          value={noVal}
          accent="text-rose-600"
          chip="bg-rose-500"
        />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-center text-white">
        <p className="text-[15px] font-semibold">
          From slot 2 on, reuse keeps the full {N} choices while no-reuse drops
          to {N - 1}, {N - 2}, …
        </p>
        <p className="mt-2 text-2xl font-extrabold">
          <span className="text-brand-300">{withVal}</span>
          <span className="text-slate-500"> vs </span>
          <span className="text-rose-300">{noVal}</span>
        </p>
      </div>
    </div>
  );
}

function CompareRow({
  title,
  terms,
  value,
  accent,
  chip,
}: {
  title: string;
  terms: number[];
  value: number;
  accent: string;
  chip: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-white p-3">
      <p className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          {terms.map((t, i) => (
            <span
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold text-white ${chip}`}
            >
              {t}
            </span>
          ))}
        </div>
        <span className={`ml-auto text-xl font-extrabold ${accent}`}>
          = {value}
        </span>
      </div>
    </div>
  );
}
