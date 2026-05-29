import { useState } from "react";
import { SlideFrame } from "@/components/ui/slide-frame";
import { RevenuePathCard } from "./components/revenue-path-card";
import { RevenuePathModal } from "./components/revenue-path-modal";
import { revenuePaths } from "./data/revenue-paths";

export function Slide5() {
  const [activePathIndex, setActivePathIndex] = useState<number | null>(null);
  const activePath =
    activePathIndex === null ? null : revenuePaths[activePathIndex] ?? null;

  return (
    <SlideFrame
      eyebrow="Data to revenue"
      challenge="01"
      title="Six ways data becomes revenue."
      subtitle="Proof from 2024. Direction from 2025."
    >
      <div className="grid h-full gap-4 lg:grid-cols-3">
        {revenuePaths.map((path, index) => (
          <RevenuePathCard
            key={path.index}
            index={path.index}
            title={path.title}
            proof={path.proof}
            onSelect={() => setActivePathIndex(index)}
          />
        ))}
      </div>
      {activePath ? (
        <RevenuePathModal
          key={activePath.index}
          path={activePath}
          onClose={() => setActivePathIndex(null)}
        />
      ) : null}
    </SlideFrame>
  );
}
