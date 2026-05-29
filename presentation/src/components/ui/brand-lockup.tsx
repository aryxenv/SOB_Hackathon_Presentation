import { cn } from "@/lib/utils";
import specialOlympicsLogo from "@/assets/logo-special-olympics.png";
import thomasMoreLogo from "@/assets/logo-thomas-more.png";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-5 shrink-0 items-center gap-2",
        className,
      )}
      aria-label="Special Olympics Belgium and Thomas More"
    >
      <img
        src={specialOlympicsLogo}
        alt="Special Olympics Belgium"
        className="h-full w-auto object-contain"
      />
      <span className="text-xs font-semibold text-muted-foreground">×</span>
      <img
        src={thomasMoreLogo}
        alt="Thomas More"
        className="h-full w-auto object-contain"
      />
    </div>
  );
}
