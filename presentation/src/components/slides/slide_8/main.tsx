import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SlideFrame } from "@/components/ui/slide-frame";
import { knownSignals, nextSignals } from "./data/gap-map";

function SignalColumn({
  title,
  items,
  isActive,
}: {
  title: string;
  items: string[];
  isActive: boolean;
}) {
  return (
    <Card className="p-6">
      <Badge variant={isActive ? "default" : "outline"}>{title}</Badge>
      <div className="mt-8 grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-md border border-border px-4 py-3 text-lg font-semibold"
          >
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Slide8() {
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
      setActiveIndex((current) => (current + 1) % 2);
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
      eyebrow="Next signal"
      challenge="02"
      title="The missing signal."
      subtitle="The next growth lever is collection, not reporting."
    >
      <div
        ref={rootRef}
        className="grid h-full gap-6 lg:grid-cols-[1fr_1fr]"
      >
        <SignalColumn
          title="Already visible"
          items={knownSignals}
          isActive={activeIndex === 0}
        />
        <SignalColumn
          title="Worth collecting next"
          items={nextSignals}
          isActive={activeIndex === 1}
        />
        <Card className="col-span-full grid grid-cols-[1fr_auto] items-center gap-6 border-primary p-6">
          <p className="text-4xl font-semibold tracking-[-0.04em]">
            Better monetization starts with better signals.
          </p>
          <div className="text-right text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            donor + sponsor data
          </div>
        </Card>
      </div>
    </SlideFrame>
  );
}
