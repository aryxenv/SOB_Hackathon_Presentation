import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ImpactSphere } from "@/components/slides/slide_13/components/ImpactSphere";

const DONATE_URL = "https://karoliskalinauskas1.github.io/SOB_Hackathon/";

function SphereStage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize(Math.floor(Math.min(rect.width, rect.height)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      className="flex h-full w-full items-center justify-center"
    >
      {size > 0 ? (
        <div style={{ width: size, height: size }}>
          <ImpactSphere />
        </div>
      ) : null}
    </div>
  );
}

export function Slide1() {
  return (
    <section className="flex h-full w-full bg-background px-14 pb-20 pt-12 text-foreground">
      <div className="grid h-full w-full gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-w-0 flex-col justify-center space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Hamilton, Ontario &mdash; 1965.
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground lg:text-5xl">
            The movement was born from data.
            <br />
            Today, that same data sustains it.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Built on the signals you already own.
          </p>
          <a
            className="inline-flex w-fit text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            href="https://www.washingtonpost.com/obituaries/2026/05/23/frank-hayden-who-laid-groundwork-special-olympics-dies-96/"
            rel="noreferrer"
            target="_blank"
          >
            Source: The Washington Post
          </a>
          <div className="flex w-fit flex-col items-center gap-2 rounded-xl border border-primary/25 bg-white/95 px-3 py-3 shadow-line">
            <QRCodeSVG value={DONATE_URL} size={112} level="M" marginSize={0} />
            <span className="max-w-[112px] break-all text-center text-[10px] font-medium leading-tight text-muted-foreground">
              {DONATE_URL}
            </span>
          </div>
        </div>

        <SphereStage />
      </div>
    </section>
  );
}
