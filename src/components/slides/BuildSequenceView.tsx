import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BuildSequenceSlide, ChoiceOption } from "../../types";

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function SortableRow({
  item,
  index,
  disabled,
}: {
  item: ChoiceOption;
  index: number;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 rounded-xl border-2 bg-white px-4 py-3.5 ${
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${
        isDragging
          ? "border-brand-400 shadow-lg"
          : "border-slate-200 shadow-sm"
      } touch-none select-none`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
        {index + 1}
      </span>
      <span className="text-[15px] font-semibold">{item.label}</span>
      {!disabled && (
        <span className="ml-auto text-slate-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <circle cx="9" cy="6" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" />
            <circle cx="15" cy="18" r="1.6" />
          </svg>
        </span>
      )}
    </div>
  );
}

/** Live visual that re-renders as the learner reorders items. */
function LiveVisual({
  slide,
  order,
}: {
  slide: BuildSequenceSlide;
  order: ChoiceOption[];
}) {
  const n = order.length;
  const count =
    slide.visual === "permutation" ? factorial(n) : Math.pow(2, n);

  return (
    <div className="rounded-xl bg-slate-900 p-4 text-white">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Live view
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {order.map((item, i) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <span className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-bold">
              {item.label}
            </span>
            {i < order.length - 1 && (
              <span className="text-slate-500">→</span>
            )}
          </span>
        ))}
      </div>
      {slide.visual === "permutation" ? (
        <p className="mt-3 text-sm text-slate-300">
          Possible orderings of {n} items:{" "}
          <span className="font-bold text-white">
            {Array.from({ length: n }, (_, i) => n - i).join(" × ")} = {count}
          </span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-300">
          Your sample-space path is{" "}
          <span className="font-bold text-white">
            {order.map((o) => o.label).join(" – ")}
          </span>
        </p>
      )}
    </div>
  );
}

export default function BuildSequenceView({
  slide,
  onComplete,
}: {
  slide: BuildSequenceSlide;
  onComplete: () => void;
}) {
  const [order, setOrder] = useState<ChoiceOption[]>(slide.items);
  const [submitted, setSubmitted] = useState(false);
  const [solved, setSolved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const isCorrect = useMemo(
    () => order.every((item, i) => item.id === slide.correctOrder[i]),
    [order, slide.correctOrder],
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSubmitted(false);
    setOrder((items) => {
      const from = items.findIndex((i) => i.id === active.id);
      const to = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, from, to);
    });
  }

  function check() {
    setSubmitted(true);
    if (isCorrect) {
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

      <div className="mt-4">
        <LiveVisual slide={slide} order={order} />
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Drag to arrange
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={order.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {order.map((item, i) => (
              <SortableRow
                key={item.id}
                item={item}
                index={i}
                disabled={solved}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
        <button onClick={check} className="btn-primary mt-5 w-full">
          Check arrangement
        </button>
      )}
    </div>
  );
}
