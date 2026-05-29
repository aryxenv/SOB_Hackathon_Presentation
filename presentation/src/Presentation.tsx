import type { ComponentType } from "react";
import { useEffect } from "react";
import { Slide1 } from "@/components/slides/slide_1/main";
import { Slide2 } from "@/components/slides/slide_2/main";
import { Slide3 } from "@/components/slides/slide_3/main";
import { Slide4 } from "@/components/slides/slide_4/main";
import { Slide5 } from "@/components/slides/slide_5/main";
import { Slide6 } from "@/components/slides/slide_6/main";
import { Slide7 } from "@/components/slides/slide_7/main";
import { Slide8 } from "@/components/slides/slide_8/main";
import { Slide9 } from "@/components/slides/slide_9/main";
import { Slide10 } from "@/components/slides/slide_10/main";
import { Slide11 } from "@/components/slides/slide_11/main";
import { Slide12 } from "@/components/slides/slide_12/main";
import { Slide13 } from "@/components/slides/slide_13/main";
import { Slide14 } from "@/components/slides/slide_14/main";
import { Slide15 } from "@/components/slides/slide_15/main";
import { usePresentationNavigation } from "@/hooks/usePresentationNavigation";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    __hideAppLoader?: () => void;
  }
}

interface SlideDefinition {
  id: string;
  label: string;
  Component: ComponentType;
  hideProgress?: boolean;
}

const slides: SlideDefinition[] = [
  { id: "slide-1", label: "Hook", Component: Slide1 },
  { id: "slide-2", label: "Agenda", Component: Slide2 },
  { id: "slide-3", label: "Owned data", Component: Slide3 },
  { id: "slide-4", label: "Evidence base", Component: Slide4 },
  { id: "slide-5", label: "Revenue paths", Component: Slide5 },
  { id: "slide-6", label: "Movement signal", Component: Slide6 },
  { id: "slide-7", label: "Sponsor proof", Component: Slide7 },
  { id: "slide-8", label: "Missing signal", Component: Slide8 },
  { id: "slide-9", label: "Supporter opportunity", Component: Slide9 },
  { id: "slide-10", label: "Supporter data", Component: Slide10 },
  {
    id: "slide-11",
    label: "Sponsor dashboard demo",
    Component: Slide11,
    hideProgress: true,
  },
  { id: "slide-12", label: "Business impact", Component: Slide12 },
  {
    id: "slide-13",
    label: "Sphere app story",
    Component: Slide13,
    hideProgress: true,
  },
  { id: "slide-14", label: "From static to community", Component: Slide14 },
  { id: "slide-15", label: "Donation forecast", Component: Slide15 },
];

export function Presentation() {
  const { activeIndex, progress } = usePresentationNavigation(slides.length);

  useEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        window.__hideAppLoader?.();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-foreground">
      <div className="relative h-screen w-screen">
        {slides.map(({ id, label, Component }, index) => {
          const isActive = index === activeIndex;

          return (
            <article
              key={id}
              aria-hidden={!isActive}
              aria-label={label}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-in-out",
                isActive
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              inert={!isActive}
            >
              <Component />
            </article>
          );
        })}

        {!slides[activeIndex]?.hideProgress ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 border-t border-border bg-white/90 px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="h-1 flex-1 rounded-sm bg-muted">
                <div
                  className="h-1 rounded-sm bg-primary transition-all duration-500 ease-in-out"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="min-w-20 text-right text-xs font-semibold text-muted-foreground">
                {activeIndex + 1} / {slides.length}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
