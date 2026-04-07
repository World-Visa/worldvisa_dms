"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useSidebar } from "@/components/ui/sidebar";
import { useLayoutStore } from "@/store/layoutStore";
import { ApplicationChatPanel } from "@/components/chat/ApplicationChatPanel";

export function ChatPanelController() {
  const chatPanel = useLayoutStore((s) => s.chatPanel);
  const closeChatPanel = useLayoutStore((s) => s.closeChatPanel);
  const { setOpen } = useSidebar();
  const pathname = usePathname();

  // Close sidebar when chat panel opens
  useEffect(() => {
    if (chatPanel) {
      setOpen(false);
    }
  }, [chatPanel, setOpen]);

  // Close chat panel when navigating to a different page
  useEffect(() => {
    closeChatPanel();
  }, [pathname, closeChatPanel]);

  return (
    <AnimatePresence>
      {chatPanel && (
        <motion.div
          key="chat-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 420, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.8 }}
          className="h-full shrink-0 overflow-hidden"
          style={{ willChange: "width" }}
        >
          <ApplicationChatPanel data={chatPanel} onClose={closeChatPanel} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
