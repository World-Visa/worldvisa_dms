"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export function ContentArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMailPage = pathname?.includes("/v2/mail") ?? false;

  return (
    <div
      className={isMailPage ? "h-full min-h-0" : "h-full p-4 md:p-4"}
    >
      {children}
    </div>
  );
}
