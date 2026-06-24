import { useState } from "react";
import type { McqSlide } from "../../types";

export default function McqSlideView({
  slide,
  onComplete,
}: {
  slide: McqSlide;
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [solved, setSolved] = useState(false);

  const isCorrect = selected === slide.correctOptionId;

  function check() {
    if (!selected) return;
    setSubmitted(true);
    if (selected === slide.correctOptionId) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold leading-tight">{slide.title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
        {slide.prompt}
      </p>

      <div className="mt-5 space-y-2.5">
        {slide.options.map((opt) => {
          const chosen = selected === opt.id;
          const showCorrect = submitted && opt.id === slide.correctOptionId;
          const showWrong = submitted && chosen && !isCorrect;
          let cls =
            "border-slate-200 bg-white hover:border-brand-300";
          if (showCorrect) cls = "border-emerald-400 bg-emerald-50";
          else if (showWrong) cls = "border-red-400 bg-red-50";
          else if (chosen) cls = "border-brand-400 bg-brand-50";
          return (
            <button
              key={opt.id}
              disabled={solved}
              onClick={() => {
                if (solved) return;
                setSelected(opt.id);
                setSubmitted(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-[15px] font-medium transition ${cls}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  chosen
                    ? "border-brand-500 bg-brand-500"
                    : "border-slate-300"
                }`}
              >
                {chosen && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {submitted && (
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
          <p className="mt-0.5">{isCorrect ? slide.explanation : slide.hint}</p>
        </div>
      )}

      {!solved && (
        <button
          onClick={check}
          disabled={!selected}
          className="btn-primary mt-5 w-full"
        >
          Check answer
        </button>
      )}
    </div>
  );
}
