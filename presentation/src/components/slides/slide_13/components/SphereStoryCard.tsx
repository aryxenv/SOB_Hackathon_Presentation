import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getTotalEuros, useDonationFeed } from "../lib/donationFeed";
import { DEFAULT_PRELIT_ATHLETES } from "../lib/sphereLayout";
import { ImpactSphere } from "./ImpactSphere";

const TOTAL_ATHLETES = 7000;

interface SphereStoryCardProps {
  compact: boolean;
}

export function SphereStoryCard({ compact }: SphereStoryCardProps) {
  const donations = useDonationFeed();
  // Total donated mirrors the web app exactly: the raw sum of donation amounts
  // from Supabase (no baseline offset), so the card matches the phone.
  const donationTotal = getTotalEuros(donations);
  const litAthletes = DEFAULT_PRELIT_ATHLETES + donations.length;
  const percentage = Math.round((litAthletes / TOTAL_ATHLETES) * 1000) / 10;
  const checkpoints = [30, 50, 70, 100];

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden border-primary/30 p-5">
      <div
        className={cn(
          "grid gap-3 rounded-md border border-primary/25 bg-primary/5 p-4 transition-all duration-700",
          compact ? "opacity-90" : "opacity-100",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-primary">
            €25 lights one athlete in red.
          </p>
          <p className="text-sm text-muted-foreground">
            Total donated:{" "}
            <span className="font-semibold text-foreground">€{donationTotal}</span>
          </p>
        </div>
        <div className="relative h-3 rounded-full bg-primary/15">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
          {checkpoints.map((checkpoint) => (
            <span
              key={checkpoint}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-background"
              style={{ left: `${checkpoint}%` }}
            />
          ))}
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {percentage}% of the globe is lit
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <ImpactSphere />
      </div>
    </Card>
  );
}
