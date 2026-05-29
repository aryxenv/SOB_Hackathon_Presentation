import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RevenuePath } from "../data/revenue-paths";

interface RevenuePathModalProps {
  path: RevenuePath;
  onClose: () => void;
}

const TRANSITION_MS = 240;

export function RevenuePathModal({ path, onClose }: RevenuePathModalProps) {
  const [isShown, setIsShown] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    // Double rAF so the initial styles (opacity-0 / scale-95) are committed
    // before flipping to the visible ones — guarantees the transition fires.
    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => setIsShown(true));
    });
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, []);

  const closeWithAnim = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsShown(false);
    window.setTimeout(onClose, TRANSITION_MS);
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeWithAnim();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeWithAnim]);

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center p-10"
      role="presentation"
      onClick={closeWithAnim}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity ease-out",
          isShown ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
      />
      <Card
        className={cn(
          "relative grid w-full max-w-4xl gap-8 border-primary p-8 transition-[opacity,transform] ease-out",
          isShown ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]",
        )}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        data-capture-arrows
        role="dialog"
        aria-modal="true"
        aria-labelledby={`revenue-path-${path.index}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-8 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {path.index} · {path.title}
            </p>
            <h2
              id={`revenue-path-${path.index}`}
              className="mt-4 text-5xl font-semibold tracking-[-0.05em]"
            >
              {path.detailTitle}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={closeWithAnim}>
            Close
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {path.stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-border p-5">
              <p className="text-5xl font-semibold tracking-[-0.06em] text-primary">
                {stat.value}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <p className="max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.03em]">
          {path.detail}
        </p>
      </Card>
    </div>
  );
}
