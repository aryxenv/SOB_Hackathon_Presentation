import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SlideFrame } from "@/components/ui/slide-frame";
import { cn } from "@/lib/utils";
import donateScreenshot from "./assets/sob-donate-500.png";

interface ComparisonRow {
  old: string;
  next: string;
}

const rows: ComparisonRow[] = [
  { old: "Donate link", next: "Live event app" },
  { old: "Third-party", next: "First-party" },
  { old: "Transaction", next: "Community" },
];

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 truncate rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          special-olympics.be/nl/donatie/
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-white p-6">
        {children}
      </div>
    </Card>
  );
}

function ComparisonCard({
  row,
  isActive,
}: {
  row: ComparisonRow;
  isActive: boolean;
}) {
  return (
    <Card
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-center gap-5 p-6 transition-colors duration-300",
        isActive ? "border-primary" : "border-border",
      )}
    >
      <div className="flex flex-col gap-3">
        <Badge variant="outline">Old</Badge>
        <p className="text-2xl font-semibold tracking-[-0.02em] text-muted-foreground">
          {row.old}
        </p>
      </div>

      <div className="flex flex-col items-center self-stretch text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span className="flex-1 border-l border-dashed border-border" />
        <span className="my-1">vs</span>
        <span className="flex-1 border-l border-dashed border-border" />
      </div>

      <div className="flex flex-col gap-3">
        <Badge variant={isActive ? "default" : "outline"}>New</Badge>
        <p className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
          {row.next}
        </p>
      </div>
    </Card>
  );
}

export function Slide14() {
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
      setActiveIndex((current) => (current + 1) % rows.length);
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
      eyebrow="A new entry point"
      challenge="03"
      title="Static page to a living community."
      subtitle="One donation flow you own, not a link you hand off."
    >
      <div
        ref={rootRef}
        className="grid h-full min-h-0 gap-6 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="min-h-0">
          <BrowserFrame>
            <img
              src={donateScreenshot}
              alt="Today's special-olympics.be/nl/donatie page showing a 500 error."
              className="max-h-full max-w-full object-contain"
            />
          </BrowserFrame>
        </div>

        <div className="grid h-full min-h-0 grid-rows-3 gap-4">
          {rows.map((row, index) => (
            <ComparisonCard
              key={row.old}
              row={row}
              isActive={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </SlideFrame>
  );
}
