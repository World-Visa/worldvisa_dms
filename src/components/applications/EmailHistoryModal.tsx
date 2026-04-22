"use client";

import { AnimatePresence, motion } from "motion/react";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { getEmailList } from "@/lib/api/email";
import { EMAIL_KEYS } from "@/hooks/useEmail";
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
  initialCompose?: { subject: string; html: string };
  autoSelectLatest?: boolean;
}

export function EmailHistoryModal({ isOpen, onOpenChange, clientEmail, clientName, initialCompose, autoSelectLatest }: EmailHistoryModalProps) {
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initialCompose) setComposeOpen(true);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const { data: latestEmailData } = useQuery({
    queryKey: EMAIL_KEYS.list(undefined, clientEmail, undefined, 1, 1),
    queryFn: () => getEmailList({ q: clientEmail, limit: 1 }),
    enabled: isOpen && !!autoSelectLatest,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!autoSelectLatest || emailId || !latestEmailData?.data?.[0]) return;
    const thread = latestEmailData.data[0];
    const navId = thread.thread_id ? `t-${thread.thread_id}` : `m-${thread._id}`;
    void setEmailState({ emailId: navId });
  }, [autoSelectLatest, latestEmailData, emailId, setEmailState]);

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
                defaultSubject={initialCompose?.subject}
                defaultHtml={initialCompose?.html}
                onClose={() => setComposeOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
