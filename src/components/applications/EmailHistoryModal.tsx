"use client";

import { AnimatePresence, motion } from "motion/react";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog";
import { EmailHistorySidebar } from "@/components/applications/EmailHistorySidebar";
import { EmailHistoryList } from "@/components/applications/EmailHistoryList";
import { EmailHistoryDetail } from "@/components/applications/EmailHistoryDetail";
import { EmailHistoryCompose } from "@/components/applications/EmailHistoryCompose";
import type { EmailHistoryCategory } from "@/types/email";
import { Button } from "../ui/primitives/button";
import { Cross2Icon } from "@radix-ui/react-icons";

const EMAIL_CATEGORIES = ["all", "received", "sent", "system"] as const;

interface EmailHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientEmail: string;
  clientName: string;
}

export function EmailHistoryModal({ isOpen, onOpenChange, clientEmail, clientName }: EmailHistoryModalProps) {
  const [composeOpen, setComposeOpen] = useState(false);

  const [{ emailCat, emailId }, setEmailState] = useQueryStates(
    {
      emailCat: parseAsStringLiteral(EMAIL_CATEGORIES).withDefault("all"),
      emailId: parseAsString.withDefault(""),
    },
    { history: "replace" },
  );

  // Clear URL state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmailState({ emailCat: "all", emailId: "" });
      setComposeOpen(false);
    }
  }, [isOpen, setEmailState]);

  const handleCategorySelect = (cat: EmailHistoryCategory) => {
    setEmailState({ emailCat: cat, emailId: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="flex h-[80vh] w-full max-w-[1240px] flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3 space-y-0">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <DialogTitle className="text-base font-medium">
              Email History{clientName ? ` — ${clientName}` : ""}
            </DialogTitle>
          </div>
          <Button size="sm" variant="secondary" mode="ghost" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            <Cross2Icon className="size-4" />
          </Button>
        </DialogHeader>

        {/* Body */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {/* Sidebar */}
          <EmailHistorySidebar
            selectedCategory={emailCat}
            onCategorySelect={handleCategorySelect}
            onCompose={() => setComposeOpen(true)}
          />

          {/* List + Detail pane */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {/* Email list — always rendered full width */}
            <EmailHistoryList
              clientEmail={clientEmail}
              category={emailCat}
              selectedId={emailId || null}
              onSelect={(id) => setEmailState({ emailId: id })}
            />

            {/* Detail panel — slides in from right */}
            <AnimatePresence>
              {emailId && (
                <motion.div
                  key={emailId}
                  className="absolute inset-0 z-10 border-l bg-white dark:bg-background"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 400, damping: 38 }}
                >
                  <EmailHistoryDetail
                    id={emailId}
                    category={emailCat}
                    onBack={() => setEmailState({ emailId: "" })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Inline compose card — slides up from bottom-right of modal */}
          <AnimatePresence>
            {composeOpen && (
              <EmailHistoryCompose
                key="compose"
                defaultTo={clientEmail}
                onClose={() => setComposeOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
