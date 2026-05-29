import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LayerCardProps {
  title: string;
  detail: string;
  index: number;
}

export function LayerCard({ title, detail, index }: LayerCardProps) {
  const targetWidth = (index + 1) * 28;
  const barRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const node = barRef.current;
    if (!node) return;
    const article = node.closest("article");
    if (!article) return;

    let timeoutId: number | null = null;

    const sync = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      const isVisible = article.getAttribute("aria-hidden") !== "true";
      if (isVisible) {
        setIsResetting(false);
        timeoutId = window.setTimeout(() => {
          setProgress(targetWidth);
        }, 180 + index * 120);
      } else {
        setIsResetting(true);
        setProgress(0);
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(article, {
      attributes: true,
      attributeFilter: ["aria-hidden"],
    });

    return () => {
      observer.disconnect();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [index, targetWidth]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Badge variant={index === 0 ? "default" : "outline"}>
          Challenge 0{index + 1}
        </Badge>
        <CardTitle className="pt-5 text-2xl">{title}</CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="h-24 border-t border-border pt-5">
          <div ref={barRef} className="h-2 w-full overflow-hidden rounded-sm bg-muted">
            <div
              className="h-2 rounded-sm bg-primary"
              style={{
                width: `${progress}%`,
                transitionProperty: "width",
                transitionDuration: isResetting ? "80ms" : "1600ms",
                transitionTimingFunction: "ease-out",
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
