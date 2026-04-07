"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { DirectionalNavViewTransition } from "@/components/ui/DirectionalNavViewTransition";

export function ContentArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMailPage = pathname?.includes("/v2/mail") ?? false;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col overflow-x-hidden scrollbar-hide overflow-y-auto",
        isMailPage ? "h-[calc(100vh-4rem)] min-h-0" : "h-[calc(100vh-4rem)] min-h-0 p-4 md:p-4",
      )}
    >
      <DirectionalNavViewTransition>{children}</DirectionalNavViewTransition>
    </div>
  );
}
