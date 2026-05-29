import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { provinceDeltas } from "../data/province-deltas";

const maxDelta = Math.max(...provinceDeltas.map((item) => Math.abs(item.delta)));

export function ProvinceDeltaChart() {
  return (
    <Card className="h-full p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-semibold">Province delta</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          athletes, 2024 to 2025
        </span>
      </div>
      <div className="grid gap-4 pt-6">
        {provinceDeltas.map((item) => {
          const width = `${(Math.abs(item.delta) / maxDelta) * 100}%`;
          const positive = item.delta >= 0;

          return (
            <div
              key={item.province}
              className="grid grid-cols-[11rem_1fr_4rem] items-center gap-4"
            >
              <div className="text-sm font-semibold">{item.province}</div>
              <div className="grid grid-cols-2 items-center">
                <div className="flex h-3 justify-end border-r border-foreground/30">
                  {!positive ? (
                    <div className="h-3 rounded-l-sm bg-foreground/25" style={{ width }} />
                  ) : null}
                </div>
                <div className="flex h-3 justify-start">
                  {positive ? (
                    <div className="h-3 rounded-r-sm bg-primary" style={{ width }} />
                  ) : null}
                </div>
              </div>
              <div
                className={cn(
                  "text-right text-sm font-semibold",
                  positive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {positive ? "+" : ""}
                {item.delta.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
