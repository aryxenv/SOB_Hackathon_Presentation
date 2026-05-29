import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PhonePreviewProps {
  visible: boolean;
}

// Logical mobile viewport the embedded web app is rendered at. iPhone 14 width.
// The actual rendered height is computed from the bezel's aspect ratio so we
// fill the bezel exactly without letterboxing.
const LOGICAL_WIDTH = 390;

const EMBED_STYLE_ID = "phone-app-embed-style";
const PHONE_APP_URL = `${import.meta.env.BASE_URL}phone-app/`;
const EMBED_STYLE = `
  html, body {
    scrollbar-width: none;
    -ms-overflow-style: none;
    overflow-x: hidden;
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar,
  *::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
  /* Tighten the SOB header so it doesn't dominate the bezel */
  .header-top {
    min-height: 4rem !important;
    padding: 0.55rem 0.75rem 0.45rem !important;
  }
  .site-main {
    padding-top: 0.5rem !important;
  }
`;

export function PhonePreview({ visible }: PhonePreviewProps) {
  const bezelRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [bezelSize, setBezelSize] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = bezelRef.current;
    if (!node) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      setBezelSize({ width: rect.width, height: rect.height });
    };
    measure();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setBezelSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = bezelSize.width > 0 ? bezelSize.width / LOGICAL_WIDTH : 1;
  const logicalHeight = scale > 0 ? bezelSize.height / scale : 0;

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (doc) {
        let style = doc.getElementById(EMBED_STYLE_ID) as HTMLStyleElement | null;
        if (!style) {
          style = doc.createElement("style");
          style.id = EMBED_STYLE_ID;
          doc.head.appendChild(style);
        }
        style.textContent = EMBED_STYLE;
      }
    } catch {
      // Same-origin should always succeed in this setup; if it ever fails,
      // fall through and just show the iframe anyway.
    }
    setLoaded(true);
  };

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-center transition-all duration-700 ease-in-out",
        visible ? "translate-x-0 opacity-100" : "translate-x-24 opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div className="h-[43rem] w-[22rem] rounded-[2.2rem] border border-foreground bg-foreground p-3 shadow-deck">
        <div
          ref={bezelRef}
          className="relative h-full overflow-hidden rounded-[1.6rem] bg-background"
        >
          {bezelSize.width > 0 ? (
            <iframe
              ref={iframeRef}
              onLoad={handleIframeLoad}
              src={PHONE_APP_URL}
              title="Special Olympics Belgium donation application preview"
              style={{
                border: 0,
                width: `${LOGICAL_WIDTH}px`,
                height: `${logicalHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                opacity: loaded ? 1 : 0,
                transition: "opacity 220ms ease-out",
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
