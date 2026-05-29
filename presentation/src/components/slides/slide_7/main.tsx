import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { SlideFrame } from "@/components/ui/slide-frame";
import { SportsRanking } from "./components/sports-ranking";
import { reachMetrics } from "./data/sponsor-proof";

export function Slide7() {
  return (
    <SlideFrame
      eyebrow="Sponsor proof"
      challenge="01"
      title="Impact is the value."
      subtitle="Visibility is the floor. Measurable impact is the price."
    >
      <div className="grid h-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <SportsRanking />
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            {reachMetrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>
          <Card className="flex flex-col border-primary p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              The sponsor line
            </p>
            <div className="flex flex-1 items-center">
              <p className="text-3xl font-semibold leading-tight tracking-[-0.03em]">
                Show what happened. Then show where impact grows next.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </SlideFrame>
  );
}
