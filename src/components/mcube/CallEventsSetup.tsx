"use client";

import type { ReactNode } from "react";
import { useCallEvents } from "@/hooks/useCallEvents";
import { CallDispositionModal } from "@/components/mcube/CallDispositionModal";

export function CallEventsSetup({ children }: { children: ReactNode }) {
  useCallEvents();
  return (
    <>
      {children}
      <CallDispositionModal />
    </>
  );
}
