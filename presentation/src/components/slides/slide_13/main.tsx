import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PhonePreview } from "./components/PhonePreview";
import { SphereStoryCard } from "./components/SphereStoryCard";

const DONATE_URL = "https://karoliskalinauskas1.github.io/SOB_Hackathon/";

export function Slide13() {
  const rootRef = useRef<HTMLElement>(null);
  const [phoneVisible, setPhoneVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const article = node.closest("article");
    if (!article) return;

    function isVisible() {
      return article!.getAttribute("aria-hidden") !== "true";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat) return;
      if (!isVisible()) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input,textarea,select,[contenteditable='true']")
      ) {
        return;
      }
      event.preventDefault();
      // Spacebar toggles the phone in and out. Real donations happen by
      // interacting with the phone itself; the big globe live-syncs via Supabase.
      setPhoneVisible((current) => !current);
    }

    function syncVisibility() {
      if (!isVisible()) {
        // Reset to the opening state when leaving the slide so it always
        // starts fresh when the speaker returns.
        setPhoneVisible(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    const observer = new MutationObserver(syncVisibility);
    observer.observe(article, {
      attributes: true,
      attributeFilter: ["aria-hidden"],
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-background p-8 text-foreground"
    >
      <div
        className="grid h-full gap-6 transition-[grid-template-columns] duration-700 ease-in-out"
        style={{
          gridTemplateColumns: phoneVisible
            ? "minmax(0, 1fr) 24rem"
            : "minmax(0, 1fr) 0rem",
        }}
      >
        <SphereStoryCard compact={phoneVisible} />
        <PhonePreview visible={phoneVisible} />
      </div>

      <div
        className={`pointer-events-none absolute bottom-10 left-10 z-20 flex flex-col items-center gap-2 rounded-xl border border-primary/25 bg-white/95 px-3 py-3 shadow-line backdrop-blur transition-all duration-500 ${
          phoneVisible
            ? "translate-y-2 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
        aria-hidden={phoneVisible}
      >
        <QRCodeSVG value={DONATE_URL} size={112} level="M" marginSize={0} />
        <span className="max-w-[112px] break-all text-center text-[10px] font-medium leading-tight text-muted-foreground">
          {DONATE_URL}
        </span>
      </div>
    </section>
  );
}
