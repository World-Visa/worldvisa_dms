"use client";

import { AnimatePresence, motion } from "motion/react";
import type { CallLog } from "@/types/callLog";
import { Button } from "@/components/ui/primitives/button";
import { ChevronLeft } from "lucide-react";
import { CallLogDetailContent } from "@/components/call-logs/CallLogDetailModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/primitives/breadcrumb";

interface CallLogsDetailPanelProps {
  log: CallLog | null;
  onBack: () => void;
}

export function CallLogsDetailPanel({ log, onBack }: CallLogsDetailPanelProps) {
  return (
    <AnimatePresence>
      {log ? (
        <motion.div
          key={log.call_id}
          className="absolute inset-0 z-10 border-l bg-white dark:bg-background"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 38 }}
        >
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center border-b px-4 py-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        mode="ghost"
                        size="sm"
                        onClick={onBack}
                        className="h-8 gap-1 px-2 text-xs"
                      >
                        <ChevronLeft className="size-3.5" />
                        Calls
                      </Button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs text-muted-foreground">
                      Call details
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <CallLogDetailContent log={log} showApplicationLink={false} />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

