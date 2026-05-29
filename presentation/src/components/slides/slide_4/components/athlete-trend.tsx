import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { athleteTrend } from "../data/evidence";

const maxValue = Math.max(...athleteTrend.map((item) => item.value));

export function AthleteTrend() {
  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-semibold">Athletes per edition</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          2015 to 2025
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-9 items-end gap-3 pt-6">
        {athleteTrend.map((item) => (
          <div key={item.year} className="flex h-full flex-col justify-end gap-3">
            <div className="text-center text-xs font-semibold text-muted-foreground">
              {item.value.toLocaleString("en-US")}
            </div>
            <div className="flex h-64 items-end border-b border-border">
              <div
                className={cn(
                  "w-full rounded-sm bg-muted",
                  item.marker === "peak" && "bg-foreground",
                  item.marker === "proof" && "bg-primary",
                  item.marker === "trajectory" && "bg-primary/70",
                  item.marker === "gap" && "bg-border",
                )}
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="text-center text-xs font-semibold text-muted-foreground">
              {item.year.slice(2)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
