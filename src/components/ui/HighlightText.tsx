"use client";

import React, { useMemo } from "react";
import { highlightText, HighlightSegment } from "@/lib/utils/highlight";
import { cn } from "@/lib/utils";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
}

export function HighlightText({
  text,
  query,
  className,
  highlightClassName,
  caseSensitive = false,
}: HighlightTextProps) {
  const segments = highlightText(text, caseSensitive ? query : query);

  if (segments.length === 1 && !segments[0].isMatch) {
    // No matches, return plain text
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment: HighlightSegment, index: number) => {
        if (segment.isMatch) {
          return (
            <mark
              key={index}
              className={cn(
                "highlight-match bg-yellow-200 text-yellow-900 px-0.5 rounded-sm",
                highlightClassName,
              )}
              aria-label={`Highlighted match: ${segment.text}`}
            >
              {segment.text}
            </mark>
          );
        }
        return segment.text;
      })}
    </span>
  );
}

export function useHighlightSegments(
  text: string,
  query: string,
): HighlightSegment[] {
  return useMemo(() => highlightText(text, query), [text, query]);
}
