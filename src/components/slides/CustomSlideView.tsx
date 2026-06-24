import type { CustomSlide } from "../../types";
import { customSlideRegistry } from "./custom/registry";

export default function CustomSlideView({
  slide,
  onComplete,
}: {
  slide: CustomSlide;
  onComplete: () => void;
}) {
  const Component = customSlideRegistry[slide.component];

  if (!Component) {
    return (
      <p className="text-slate-500">
        Unknown slide component: <code>{slide.component}</code>
      </p>
    );
  }

  return <Component slide={slide} onComplete={onComplete} />;
}
