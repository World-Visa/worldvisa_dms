"use client";

import { useState, useEffect } from "react";
import { PhoneOff, Phone, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/primitives/button";
import { Label } from "@/components/ui/primitives/label";
import { useCallDispositionStore } from "@/store/callDispositionStore";
import { useUpdateCallNotes } from "@/hooks/useCallLogs";
import { AGENT_STATUS_OPTIONS } from "@/lib/constants/callDisposition";
import { showSuccessToast, showErrorToast } from "@/components/ui/primitives/sonner-helpers";
import type { CallAgentStatus } from "@/types/callLog";

export function CallDispositionModal() {
  const { isModalOpen, pendingCall, closeDispositionModal, clearPendingCall } = useCallDispositionStore();

  const [callAgentStatus, setCallAgentStatus] = useState<CallAgentStatus | "">("");
  const [callNote, setCallNote]               = useState("");

  const { mutate, isPending } = useUpdateCallNotes();

  useEffect(() => {
    if (pendingCall) {
      setCallAgentStatus(pendingCall.call_agent_status ?? "");
      setCallNote(pendingCall.call_note ?? "");
    }
  }, [pendingCall]);

  function handleClose() {
    setCallAgentStatus("");
    setCallNote("");
    closeDispositionModal();
    setTimeout(clearPendingCall, 200);
  }

  function handleSubmit() {
    if (!pendingCall) return;
    mutate(
      {
        callId:  pendingCall.call_id,
        payload: { call_agent_status: callAgentStatus || null, call_note: callNote.trim() || null },
      },
      {
        onSuccess: () => { showSuccessToast("Call disposition saved successfully"); handleClose(); },
        onError:   (error) => showErrorToast(`Failed to save disposition: ${error.message}`),
      },
    );
  }

  if (!pendingCall) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-[460px] gap-5 p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
            <PhoneOff className="size-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold leading-snug">Call Ended</DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
              Log a disposition for this call before dismissing.
            </DialogDescription>
          </div>
        </div>

        {/* Call summary */}
        <div className="rounded-lg flex flex-col gap-1.5 border border-stroke-soft bg-neutral-50 dark:bg-neutral-900/40 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-3.5 shrink-0" />
            <span className="truncate">{pendingCall.client_name ?? "Unknown Caller"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            <span>{pendingCall.customer_phone}</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="disp-agent-status" className="text-sm">Call Outcome</Label>
            <Select value={callAgentStatus} onValueChange={(v) => setCallAgentStatus(v as CallAgentStatus)}>
              <SelectTrigger id="disp-agent-status">
                <SelectValue placeholder="Select outcome…" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="disp-call-note" className="text-sm">
              Note&nbsp;
              <span className="font-normal text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="disp-call-note"
              rows={3}
              placeholder="Add a note about this call…"
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              className="resize-y text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="-mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-stroke-soft bg-neutral-50 dark:bg-neutral-900/40 px-5 py-3">
          <Button variant="secondary" mode="outline" size="xs" className="text-xs" onClick={handleClose} disabled={isPending}>
            Dismiss
          </Button>
          <Button size="xs" variant="secondary" mode="filled" className="text-xs" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : "Save & Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
