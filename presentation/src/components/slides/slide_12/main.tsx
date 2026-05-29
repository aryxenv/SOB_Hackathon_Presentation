import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SlideFrame } from "@/components/ui/slide-frame";

const impactColumns = [
  {
    title: "Increased revenue",
    items: ["Recurring sponsorships", "Better targeting", "Stronger retention"],
  },
  {
    title: "Reduced costs",
    items: ["Less wasted outreach", "Lower acquisition cost", "Efficient fundraising"],
  },
];

export function Slide12() {
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
      setActiveIndex((current) => (current + 1) % impactColumns.length);
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
      eyebrow="Business impact"
      challenge="02"
      title="More repeat support. Less wasted outreach."
    >
      <div
        ref={rootRef}
        className="grid h-full gap-6 lg:grid-cols-2"
      >
        {impactColumns.map((column, index) => {
          const isActive = index === activeIndex;
          return (
            <Card
              key={column.title}
              className="flex flex-col p-8"
            >
              <Badge variant={isActive ? "default" : "outline"}>
                {index === 0 ? "Revenue" : "Cost"}
              </Badge>
              <h2 className="mt-10 text-5xl font-semibold tracking-[-0.05em]">
                {column.title}
              </h2>
              <div className="mt-10 grid gap-4">
                {column.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-border px-5 py-4 text-2xl font-semibold tracking-[-0.03em]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </SlideFrame>
  );
}
