"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { RiCloseLine } from "react-icons/ri";
import { useLayoutStore } from "@/store/layoutStore";
import { MessageWindow } from "@/components/nira-agent/message-window";
import { ConverstionDropdown } from "@/components/nira-agent/converstion-dropdown";

function NiraPanel({
  initialQuery,
  onClose,
}: {
  initialQuery: string;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full w-full shrink-0 flex-col overflow-hidden border border-stroke-soft bg-bg-white">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-neutral-100 px-3">
        <ConverstionDropdown className="min-w-0" />
        <button
          onClick={onClose}
          aria-label="Close Nira panel"
          className="flex size-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <RiCloseLine className="size-4" />
        </button>
      </div>

      {/* Chat body */}
      <div className="min-h-0 flex-1">
        <MessageWindow initialQuery={initialQuery} />
      </div>
    </div>
  );
}

export function NiraPanelController() {
  const niraPanelOpen = useLayoutStore((s) => s.niraPanelOpen);
  const niraPanelInitialQuery = useLayoutStore((s) => s.niraPanelInitialQuery);
  const closeNiraPanel = useLayoutStore((s) => s.closeNiraPanel);
  const pathname = usePathname();

  useEffect(() => {
    closeNiraPanel();
  }, [pathname, closeNiraPanel]);

  return (
    <AnimatePresence>
      {niraPanelOpen && (
        <motion.div
          key="nira-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 420, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.8 }}
          className="h-full shrink-0 overflow-hidden"
          style={{ willChange: "width" }}
        >
          <NiraPanel
            key={niraPanelInitialQuery}
            initialQuery={niraPanelInitialQuery}
            onClose={closeNiraPanel}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
