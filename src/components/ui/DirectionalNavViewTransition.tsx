"use client";

import { type ReactNode } from "react";
import { ViewTransition } from "react";

export function DirectionalNavViewTransition({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ViewTransition
      default="none"
      enter={{
        "nav-forward": "slide-from-right",
        "nav-back": "slide-from-left",
        default: "none",
      }}
      exit={{
        "nav-forward": "slide-to-left",
        "nav-back": "slide-to-right",
        default: "none",
      }}
    >
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
        {children}
      </div>
    </ViewTransition>
  );
}
