import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BrandLockup } from "@/components/ui/brand-lockup";

interface SlideFrameProps {
  eyebrow?: string;
  challenge?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function SlideFrame({
  eyebrow,
  challenge,
  title,
  children,
  className,
  titleClassName,
}: SlideFrameProps) {
  return (
    <section
      className={cn(
        "flex h-full w-full flex-col bg-background px-14 pb-20 pt-12 text-foreground",
        className,
      )}
    >
      <header className="border-b border-border pb-8">
        {eyebrow ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              {challenge ? (
                <>
                  <span>{`Challenge ${challenge}`}</span>
                  <span className="mx-2 text-primary/50">&middot;</span>
                </>
              ) : null}
              {eyebrow}
            </p>
            <BrandLockup />
          </div>
        ) : null}
        <div className="mt-5 grid gap-4 lg:grid-cols-1 lg:items-end">
          <h1
            className={cn(
              "max-w-none text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-foreground lg:text-7xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
        </div>
      </header>
      <div className="min-h-0 flex-1 pt-8">{children}</div>
    </section>
  );
}
