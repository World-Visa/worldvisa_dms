"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/primitives/button";
import { CallLogsSidebar, type CallLogsCategory } from "@/components/applications/CallLogsSidebar";
import { CallLogsList } from "@/components/applications/CallLogsList";
import { CallLogsDetailPanel } from "@/components/applications/CallLogsDetailPanel";
import type { CallLog } from "@/types/callLog";

function normalizePhoneToLast10Digits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

interface CallLogsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customerPhone: string;
  customerName?: string;
}

export function CallLogsModal({ isOpen, onOpenChange, customerPhone, customerName }: CallLogsModalProps) {
  const [category, setCategory] = useState<CallLogsCategory>("all");
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

  const q = useMemo(() => normalizePhoneToLast10Digits(customerPhone), [customerPhone]);

  useEffect(() => {
    if (!isOpen) {
      setCategory("all");
      setSelectedLog(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="flex h-[80vh] w-full max-w-[1240px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3 space-y-0">
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <DialogTitle className="text-base font-medium">
              Call Logs{customerName ? ` — ${customerName}` : ""}
            </DialogTitle>
          </div>
          <Button size="sm" variant="secondary" mode="ghost" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            <Cross2Icon className="size-4" />
          </Button>
        </DialogHeader>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <CallLogsSidebar
            selectedCategory={category}
            onCategorySelect={(c) => {
              setCategory(c);
              setSelectedLog(null);
            }}
          />

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <CallLogsList
              q={q}
              direction={category === "all" ? "all" : category}
              selectedCallId={selectedLog?.call_id ?? null}
              onSelect={(log) => setSelectedLog(log)}
              limit={10}
            />

            <CallLogsDetailPanel log={selectedLog} onBack={() => setSelectedLog(null)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

