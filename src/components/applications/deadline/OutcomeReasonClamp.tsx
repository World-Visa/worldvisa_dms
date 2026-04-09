"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function OutcomeReasonClamp({
  bodyText,
  detailOpen,
  onViewMore,
  onViewLess,
}: {
  bodyText: string;
  detailOpen: boolean;
  onViewMore: () => void;
  onViewLess: () => void;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    if (detailOpen) {
      setOverflows(false);
      return;
    }
    const el = textRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [bodyText, detailOpen]);

  const fontStyle = { fontFeatureSettings: "'ss11', 'calt' 0" } as const;
  const textExpandedClass =
    "text-sm text-[#171717] leading-relaxed whitespace-pre-wrap w-full break-words";
  const textClampedClass =
    "text-sm text-[#171717] leading-relaxed w-full break-words line-clamp-1";

  const toggleClass =
    "mt-1 text-left text-[11px] font-medium text-[#171717] underline underline-offset-2 decoration-[#a3a3a3] hover:decoration-[#171717] select-none";

  if (detailOpen) {
    return (
      <div className="flex flex-col gap-1 w-full min-w-0">
        <p className={textExpandedClass} style={fontStyle}>
          {bodyText}
        </p>
        <button type="button" onClick={onViewLess} className={toggleClass}>
          View less
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 w-full min-w-0">
      <p ref={textRef} className={textClampedClass} style={fontStyle}>
        {bodyText}
      </p>
      {overflows ? (
        <button type="button" onClick={onViewMore} className={toggleClass}>
          View more
        </button>
      ) : null}
    </div>
  );
}
