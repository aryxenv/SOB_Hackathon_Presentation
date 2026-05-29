import { Card } from "@/components/ui/card";
import { SlideFrame } from "@/components/ui/slide-frame";

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="absolute bottom-4 right-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      Source: {label}
    </a>
  );
}

export function Slide9() {
  return (
    <SlideFrame
      eyebrow="Supporter intelligence"
      challenge="02"
      title="Revenue lives in repeat support."
    >
      <div className="grid h-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="relative flex flex-col justify-center border-primary p-8">
          <p className="max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.05em]">
            The smarter route is not selling data. It is using data to keep
            supporters close.
          </p>
          <SourceLink
            href="https://givingusa.org/generosity-is-evolving-are-we-paying-attention/"
            label="Giving USA"
          />
        </Card>
        <div className="grid gap-4">
          <Card className="relative grid gap-4 p-6 pb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Acquisition vs retention
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
              <div className="flex min-h-32 flex-col justify-center rounded-md border border-primary p-5 text-primary">
                <p className="text-5xl font-semibold tracking-[-0.06em]">
                  $1.50
                </p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em]">
                  costly to acquire
                </p>
              </div>
              <div className="flex items-center text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                vs
              </div>
              <div className="flex min-h-32 flex-col justify-center rounded-md border border-foreground p-5 text-foreground">
                <p className="text-5xl font-semibold tracking-[-0.06em]">
                  $0.20
                </p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em]">
                  better to retain
                </p>
              </div>
            </div>
            <SourceLink
              href="https://www.bonterratech.com/blog/fundraising-metrics"
              label="Bonterra"
            />
          </Card>

          <Card className="relative grid grid-cols-[11rem_1fr] items-center gap-6 p-6 pb-10">
            <p className="text-5xl font-semibold tracking-[-0.06em] text-primary">
              19.4%
            </p>
            <p className="text-xl font-semibold tracking-[-0.03em]">
              new donors give again
            </p>
            <SourceLink
              href="https://neonone.com/resources/blog/donor-retention/"
              label="Neon One"
            />
          </Card>
        </div>
      </div>
    </SlideFrame>
  );
}
