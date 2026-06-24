import { useEffect } from "react";
import type { ConceptSlide } from "../../types";

export default function ConceptSlideView({
  slide,
  onComplete,
}: {
  slide: ConceptSlide;
  onComplete: () => void;
}) {
  // A concept slide has no required interaction; mark it satisfied on view.
  useEffect(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">{slide.title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
        {slide.body}
      </p>
      {slide.points && (
        <ul className="mt-4 space-y-2">
          {slide.points.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 text-[15px] font-medium text-brand-900"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
