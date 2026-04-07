import { useEffect, useRef, useState } from "react";

export function useJiggle(count: number, durationMs = 3100) {
  const [jiggle, setJiggle] = useState(false);
  const prevRef = useRef(count);

  useEffect(() => {
    if (count > prevRef.current) {
      setJiggle(true);
      const t = setTimeout(() => setJiggle(false), durationMs);
      return () => clearTimeout(t);
    }
    prevRef.current = count;
  }, [count, durationMs]);

  return jiggle;
}
