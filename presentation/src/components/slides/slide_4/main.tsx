import { MetricCard } from "@/components/ui/metric-card";
import { SlideFrame } from "@/components/ui/slide-frame";
import { AthleteTrend } from "./components/athlete-trend";
import { evidenceMetrics } from "./data/evidence";

export function Slide4() {
  return (
    <SlideFrame
      eyebrow="Evidence base"
      challenge="01"
      title="Evidence worth noting."
      subtitle="Validated participation history becomes a funding asset."
    >
      <div className="grid h-full gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="grid gap-4">
          {evidenceMetrics.map((metric, index) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              tone={index === evidenceMetrics.length - 1 ? "primary" : "default"}
            />
          ))}
        </div>
        <AthleteTrend />
      </div>
    </SlideFrame>
  );
}
