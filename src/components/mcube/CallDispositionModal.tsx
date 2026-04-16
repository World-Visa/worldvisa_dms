"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhoneOff, Phone, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCallDispositionStore } from "@/store/callDispositionStore";
import { updateCallNotes } from "@/lib/api/callLogs";
import { callLogKeys } from "@/hooks/useCallLogs";
import type { CallAgentStatus, CallLogDetailResponse, CallLogListResponse } from "@/types/callLog";

const AGENT_STATUS_OPTIONS: { value: CallAgentStatus; label: string }[] = [
  { value: "answered",                label: "Answered" },
  { value: "unanswered",              label: "Unanswered" },
  { value: "client_busy",             label: "Client Busy" },
  { value: "client_asked_call_later", label: "Client Asked to Call Later" },
  { value: "not_connected",           label: "Not Connected" },
  { value: "none",                    label: "None" },
];

export function CallDispositionModal() {
  const { isModalOpen, pendingCall, closeDispositionModal } = useCallDispositionStore();
  const queryClient = useQueryClient();

  const [callAgentStatus, setCallAgentStatus] = useState<CallAgentStatus | "">("");
  const [callNote, setCallNote]               = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateCallNotes(pendingCall!.call_id, {
        call_agent_status: callAgentStatus || null,
        call_note:         callNote.trim() || null,
      }),
    onSuccess: (res: CallLogDetailResponse) => {
      const updated = res.data.callLog;

      // Update detail cache if open
      queryClient.setQueryData(callLogKeys.detail(updated.call_id), {
        status: "success",
        data:   { callLog: updated },
      });

      // Update all list caches in-place
      queryClient.setQueriesData<CallLogListResponse>(
        { queryKey: callLogKeys.all(), exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              callLogs: old.data.callLogs.map((log) =>
                log.call_id === updated.call_id ? updated : log,
              ),
            },
          };
        },
      );

      handleClose();
    },
  });

  function handleClose() {
    setCallAgentStatus("");
    setCallNote("");
    closeDispositionModal();
  }

  if (!pendingCall) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-[460px] gap-5 p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
            <PhoneOff className="size-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold leading-snug">
              Call Ended
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
              Log a disposition for this call before dismissing.
            </DialogDescription>
          </div>
        </div>

        {/* Call summary */}
        <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-1.5 text-sm">
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
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="call-agent-status">Call Outcome</Label>
            <Select
              value={callAgentStatus}
              onValueChange={(v) => setCallAgentStatus(v as CallAgentStatus)}
            >
              <SelectTrigger id="call-agent-status">
                <SelectValue placeholder="Select outcome…" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="call-note">
              Note{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="call-note"
              rows={3}
              placeholder="Add a note about this call…"
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="-mx-5 -mb-5 flex items-center justify-between border-t bg-muted/50 px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isPending}
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={() => mutate()}
            disabled={isPending}
            className="bg-neutral-900 text-white"
          >
            {isPending ? "Saving…" : "Save & Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
