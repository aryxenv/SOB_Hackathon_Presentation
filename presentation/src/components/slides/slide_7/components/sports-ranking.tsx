import { Card } from "@/components/ui/card";
import { sportsRanking } from "../data/sponsor-proof";

const maxMedals = Math.max(...sportsRanking.map((item) => item.medals));

export function SportsRanking() {
  return (
    <Card className="h-full p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-semibold">Gold medals</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          2024
        </span>
      </div>
      <div className="grid gap-4 pt-6">
        {sportsRanking.map((item) => (
          <div key={item.sport} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-4">
            <span className="text-sm font-semibold">{item.sport}</span>
            <span className="h-3 rounded-sm bg-muted">
              <span
                className="block h-3 rounded-sm bg-primary"
                style={{ width: `${(item.medals / maxMedals) * 100}%` }}
              />
            </span>
            <span className="text-right text-sm font-semibold">{item.medals}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
