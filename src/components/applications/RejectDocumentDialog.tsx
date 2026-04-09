"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, X } from "lucide-react";

interface RejectDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  /** Optional context name (e.g. file name); contextual line is not shown when omitted. */
  documentName?: string;
  isLoading?: boolean;
  title?: string;
  confirmLabel?: string;
  labelText?: string;
  placeholder?: string;
  loadingLabel?: string;
}

export function RejectDocumentDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = "Reject Document",
  confirmLabel = "Reject Document",
  labelText = "Please provide a reason for rejection *",
  placeholder = "Enter the reason for rejecting this document...",
  loadingLabel = "Sending request...",
}: RejectDocumentDialogProps) {
  const [reason, setReason] = useState("");
  const fieldId = React.useId();

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason("");
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[440px] gap-4 overflow-hidden p-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
            <AlertTriangle className="size-5" />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold leading-snug">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={fieldId}>{labelText}</Label>
            <Textarea
              id={fieldId}
              placeholder={placeholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[110px] resize-none"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="-mx-5 -mb-5 flex flex-row items-center justify-end gap-2 border-t bg-muted/50 px-5 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {loadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
