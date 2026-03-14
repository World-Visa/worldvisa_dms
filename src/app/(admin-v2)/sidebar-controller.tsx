"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { useLayoutStore } from "@/store/layoutStore";

export function SidebarController() {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const { setSidebarForcedCollapsed } = useLayoutStore();
  const prevWasMailRef = useRef<boolean | null>(null);

  useEffect(() => {
    const isMailRoute = pathname.startsWith("/v2/mail");

    if (isMailRoute && prevWasMailRef.current === false) {
      // Entering mail route — collapse sidebar once
      setOpen(false);
      setSidebarForcedCollapsed(true);
    } else if (!isMailRoute && prevWasMailRef.current === true) {
      // Leaving mail route — restore sidebar
      setOpen(true);
      setSidebarForcedCollapsed(false);
    } else if (prevWasMailRef.current === null) {
      // First render — if on mail route, collapse
      if (isMailRoute) {
        setOpen(false);
        setSidebarForcedCollapsed(true);
      }
    }

    prevWasMailRef.current = isMailRoute;
  }, [pathname, setOpen, setSidebarForcedCollapsed]);

  return null;
}
