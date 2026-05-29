import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SlideFrame } from "@/components/ui/slide-frame";
import { supporterSignals } from "./data/supporter-signals";

export function Slide10() {
  return (
    <SlideFrame
      eyebrow="Supporter memory"
      challenge="02"
      title="Missing data behind repeat support."
    >
      <div className="grid h-full gap-4 lg:grid-cols-3">
        {supporterSignals.map((item, index) => (
          <Card key={item.signal} className="flex flex-col justify-between p-6">
            <Badge variant={index % 2 === 0 ? "outline" : "default"}>
              0{index + 1}
            </Badge>
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                {item.signal}
              </h2>
              <div className="mt-6 h-px bg-border" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.unlocks}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </SlideFrame>
  );
}
