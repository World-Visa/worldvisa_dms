"use client";

import { cn } from "@/lib/utils";

interface ReadTickProps {
  isRead: boolean;
  className?: string;
}

export function ReadTick({ isRead, className }: ReadTickProps) {
  return (
    <svg
      width="16"
      height="11"
      viewBox="0 0 16 11"
      fill="none"
      aria-label={isRead ? "Read" : "Sent"}
      className={cn(
        "shrink-0 transition-colors duration-300",
        isRead ? "text-blue-400" : "opacity-50",
        className,
      )}
    >
      {/* First tick */}
      <path
        d="M1 5.5L4.5 9L10 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Second tick (offset right) */}
      <path
        d="M5.5 5.5L9 9L14.5 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
