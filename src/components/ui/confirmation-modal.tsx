"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "default" | "destructive";
  hideCancelButton?: boolean;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  isLoading = false,
  disabled = false,
  variant = "default",
  hideCancelButton = false,
}: ConfirmationModalProps) {
  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[440px] gap-4 overflow-hidden p-5"
      >
        {/* ── Header row: icon + close ────────────────── */}
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl",
              isDestructive
                ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                : "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
            )}
          >
            <AlertTriangle className="size-5" />
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Content: title + description ────────────── */}
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-base font-semibold leading-snug">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </div>

        {/* ── Footer: full-width gray bg + buttons ─────── */}
        <div className="-mx-5 -mb-5 flex flex-row items-center justify-end gap-2 border-t bg-muted/50 px-5 py-4">
          {!hideCancelButton && (
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            disabled={isLoading || disabled}
            premium3D
            onClick={onConfirm}
          >
            {isLoading ? "Loading…" : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
