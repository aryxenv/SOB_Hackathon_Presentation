import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SlideFrame } from "@/components/ui/slide-frame";
import { cn } from "@/lib/utils";

const flow = [
  {
    label: "Owned data",
    value: "11 years",
  },
  {
    label: "Better decisions",
    value: "where + why",
  },
  {
    label: "Revenue proof",
    value: "fund + renew",
  },
];

export function Slide3() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const article = node.closest("article");
    if (!article) return;

    function isVisible() {
      return article!.getAttribute("aria-hidden") !== "true";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat) return;
      if (!isVisible()) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input,textarea,select,[contenteditable='true']")
      ) {
        return;
      }
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flow.length);
    }

    function syncVisibility() {
      if (!isVisible()) setActiveIndex(0);
    }

    window.addEventListener("keydown", handleKeyDown);
    const observer = new MutationObserver(syncVisibility);
    observer.observe(article, {
      attributes: true,
      attributeFilter: ["aria-hidden"],
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      observer.disconnect();
    };
  }, []);

  return (
    <SlideFrame
      eyebrow="Owned data"
      challenge="01"
      title="Turn SOB data into revenue."
    >
      <div
        ref={rootRef}
        className="grid h-full content-center gap-6 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <Card className="flex flex-col justify-center p-8 text-left">
          <Badge variant="outline">The question underneath</Badge>
          <p className="mt-8 text-5xl font-semibold leading-[1.04] tracking-[-0.05em]">
            Are we using our data to drive decisions - or just storing it?
          </p>
        </Card>

        <div className="grid gap-4">
          {flow.map((step, index) => {
            const isActive = index === activeIndex;
            return (
              <div key={step.label}>
                <Card
                  className={cn(
                    "grid min-h-32 grid-cols-[7rem_1fr] items-center gap-5 p-6 transition-colors duration-300",
                    isActive && "border-primary",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-md border text-2xl font-semibold transition-colors duration-300",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-foreground",
                    )}
                  >
                    0{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {step.label}
                    </p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
                      {step.value}
                    </p>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </SlideFrame>
  );
}
