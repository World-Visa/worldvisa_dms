import { useEffect, useState } from "react";

const MIN_DOCK_PX = 280;
const MAX_DOCK_PX = 370;
const VIEWPORT_FRACTION = 0.26;

const SSR_ASSUMED_INNER_WIDTH = 1024;

export function computePhoneDockWidth(innerWidth: number): number {
  return Math.round(
    Math.min(MAX_DOCK_PX, Math.max(MIN_DOCK_PX, innerWidth * VIEWPORT_FRACTION)),
  );
}

export function usePhoneDockWidth(): number {
  const [width, setWidth] = useState(() =>
    computePhoneDockWidth(SSR_ASSUMED_INNER_WIDTH),
  );

  useEffect(() => {
    const update = () => setWidth(computePhoneDockWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
}
