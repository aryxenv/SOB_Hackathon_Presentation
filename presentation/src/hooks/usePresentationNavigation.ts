import { useEffect, useMemo, useState } from "react";

const arrowKeys = new Set(["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]);
const interactiveSelector = [
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "[role='textbox']",
  "[role='slider']",
  "[role='listbox']",
  "[role='grid']",
  "[role='tablist']",
  "[data-capture-arrows]",
].join(",");

function shouldIgnoreDeckNavigation(event: KeyboardEvent) {
  if (!arrowKeys.has(event.key) || event.defaultPrevented) {
    return true;
  }

  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return true;
  }

  const target = event.target;

  return target instanceof Element && target.closest(interactiveSelector) !== null;
}

export function usePresentationNavigation(slideCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnoreDeckNavigation(event)) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % slideCount);
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + slideCount) % slideCount);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slideCount]);

  return useMemo(
    () => ({
      activeIndex,
      progress: slideCount === 0 ? 0 : (activeIndex + 1) / slideCount,
    }),
    [activeIndex, slideCount],
  );
}
