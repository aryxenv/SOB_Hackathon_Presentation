import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { SlideFrame } from "@/components/ui/slide-frame";
import { ProvinceDeltaChart } from "./components/province-delta-chart";

export function Slide6() {
  return (
    <SlideFrame
      eyebrow="Movement signal"
      challenge="01"
      title="Follow the movement."
      subtitle="Place effort where demand is moving, not where habit says it belongs."
    >
      <div className="grid h-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <ProvinceDeltaChart />
        <div className="grid gap-6">
          <MetricCard
            label="2024 leader"
            value="Hainaut"
            detail="452 athletes before the shift."
          />
          <MetricCard
            label="2025 leader"
            value="West-Vlaanderen"
            detail="401 athletes after +22.6% growth."
          />
          <Card className="border-primary p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Decision rule
            </p>
            <p className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em]">
              Growth beats tradition.
            </p>
          </Card>
        </div>
      </div>
    </SlideFrame>
  );
}
