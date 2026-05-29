import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SlideFrame } from "@/components/ui/slide-frame";
import { cn } from "@/lib/utils";

interface YearPoint {
  year: string;
  value: number;
  label: string;
}

interface Scenario {
  name: string;
  headline: string;
  years: YearPoint[];
  params: { label: string; value: string }[];
}

const scenarios: Scenario[] = [
  {
    name: "Conservative",
    headline: "€1,872",
    years: [
      { year: "Y1", value: 1200, label: "€1,200" },
      { year: "Y2", value: 1440, label: "€1,440" },
      { year: "Y3", value: 1872, label: "€1,872" },
    ],
    params: [
      { label: "MAU Year 1", value: "2,000" },
      { label: "Conversion", value: "0.5%" },
      { label: "Avg donation", value: "€10 / mo" },
    ],
  },
  {
    name: "Realistic",
    headline: "€18,720",
    years: [
      { year: "Y1", value: 12000, label: "€12k" },
      { year: "Y2", value: 14400, label: "€14k" },
      { year: "Y3", value: 18720, label: "€19k" },
    ],
    params: [
      { label: "MAU Year 1", value: "10,000" },
      { label: "Conversion", value: "1.0%" },
      { label: "Avg donation", value: "€10 / mo" },
    ],
  },
  {
    name: "Optimistic",
    headline: "€187,200",
    years: [
      { year: "Y1", value: 120000, label: "€120k" },
      { year: "Y2", value: 144000, label: "€144k" },
      { year: "Y3", value: 187200, label: "€187k" },
    ],
    params: [
      { label: "MAU Year 1", value: "50,000" },
      { label: "Conversion", value: "2.0%" },
      { label: "Avg donation", value: "€10 / mo" },
    ],
  },
];

function ScenarioCard({
  scenario,
  isActive,
}: {
  scenario: Scenario;
  isActive: boolean;
}) {
  const max = Math.max(...scenario.years.map((point) => point.value));

  return (
    <Card
      className={cn(
        "flex flex-col gap-6 p-7 transition-colors duration-300",
        isActive ? "border-primary" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <Badge variant={isActive ? "default" : "outline"}>{scenario.name}</Badge>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Year 3 revenue
        </p>
        <p
          className={cn(
            "mt-2 text-5xl font-semibold leading-none tracking-[-0.05em]",
            isActive ? "text-primary" : "text-foreground",
          )}
        >
          {scenario.headline}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {scenario.years.map((point) => (
          <div key={point.year} className="flex items-center gap-3">
            <span className="w-6 text-xs font-semibold text-muted-foreground">
              {point.year}
            </span>
            <span className="h-2 flex-1 rounded-sm bg-muted">
              <span
                className="block h-2 rounded-sm bg-primary"
                style={{ width: `${(point.value / max) * 100}%` }}
              />
            </span>
            <span className="w-12 text-right text-xs font-semibold">
              {point.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 border-t border-border pt-4">
        {scenario.params.map((param) => (
          <div
            key={param.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{param.label}</span>
            <span className="font-semibold">{param.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Slide15() {
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
      setActiveIndex((current) => (current + 1) % scenarios.length);
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
      eyebrow="Financial impact"
      challenge="03"
      title="What the app could raise."
    >
      <div ref={rootRef} className="flex h-full min-h-0 flex-col gap-6">
        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-3">
          {scenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.name}
              scenario={scenario}
              isActive={index === activeIndex}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-border bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
          <span>
            Formula{" "}
            <span className="font-semibold text-foreground">
              MAU × Conversion % × Avg donation × 12
            </span>
          </span>
          <span>
            Growth{" "}
            <span className="font-semibold text-foreground">
              +20% Year 2 · +30% Year 3
            </span>
          </span>
        </div>
      </div>
    </SlideFrame>
  );
}
