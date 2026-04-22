"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
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
  const [iframeMounted, setIframeMounted] = useState(false);

  useEffect(() => {
    if (phonePanelOpen && !iframeMounted) setIframeMounted(true);
  }, [phonePanelOpen, iframeMounted]);

  useEffect(() => {
    if (phonePanelOpen) setOpen(false);
  }, [phonePanelOpen, setOpen]);

  useEffect(() => {
    closePhonePanel();
  }, [pathname, closePhonePanel]);

  return (
    <motion.div
      animate={{ width: phonePanelOpen ? dockWidth : 0, opacity: phonePanelOpen ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.8 }}
      className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l bg-background"
      style={{ willChange: "width", pointerEvents: phonePanelOpen ? undefined : "none" }}
    >
      {iframeMounted && <SlidePhoneCard onClose={closePhonePanel} />}
    </motion.div>
  );
}
