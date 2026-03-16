"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useMailStore } from "@/store/mailStore";
import { MailDisplay } from "@/components/mail/mail-display";
import type { EmailThread } from "@/types/email";

function getNavId(thread: EmailThread): string {
  return thread.thread_id ? `t-${thread.thread_id}` : `m-${thread._id}`;
}

export function MailDisplayMobile() {
  const { selectedMail, setSelectedMail } = useMailStore();

  const navId = selectedMail ? getNavId(selectedMail) : null;
  const subject = selectedMail?.subject ?? "";

  return (
    <AnimatePresence>
      {selectedMail && (
        <motion.div
          key="mail-detail-mobile"
          className="fixed inset-0 z-50 flex flex-col bg-background"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 38 }}>

          {/* Header */}
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background px-3">
            <button
              type="button"
              aria-label="Back to inbox"
              onClick={() => setSelectedMail(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="size-5" />
            </button>
            <p className="flex-1 truncate text-sm font-medium text-foreground">
              {subject}
            </p>
          </div>

          {/* Email content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MailDisplay id={navId} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
