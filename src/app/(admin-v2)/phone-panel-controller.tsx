"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useSidebar } from "@/components/ui/sidebar";
import { useLayoutStore } from "@/store/layoutStore";
import { usePhoneDockWidth } from "@/hooks/usePhoneDockWidth";
import SlidePhoneCard from "@/components/mcube/SlidePhoneCard";

export function PhonePanelController() {
  const phonePanelOpen = useLayoutStore((s) => s.phonePanelOpen);
  const closePhonePanel = useLayoutStore((s) => s.closePhonePanel);
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const dockWidth = usePhoneDockWidth();

  useEffect(() => {
    if (phonePanelOpen) {
      setOpen(false);
    }
  }, [phonePanelOpen, setOpen]);

  useEffect(() => {
    closePhonePanel();
  }, [pathname, closePhonePanel]);

  return (
    <AnimatePresence>
      {phonePanelOpen && (
        <motion.div
          key="phone-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: dockWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.8 }}
          className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l bg-background"
          style={{ willChange: "width" }}
        >
          <SlidePhoneCard onClose={closePhonePanel} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
