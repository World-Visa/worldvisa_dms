"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Share2, X } from "lucide-react";
import { Kbd } from "@/components/ui/primitives/kbd";
import {
  RiCornerDownLeftLine,
  RiLoader4Line,
  RiQuestionLine,
} from "react-icons/ri";

interface PublishToClientDialogProps {
  open: boolean;
  text: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onTextChange: (next: string) => void;
  onSend: () => void;
}

export function PublishToClientDialog({
  open,
  text,
  isPending,
  onOpenChange,
  onClose,
  onTextChange,
  onSend,
}: PublishToClientDialogProps) {
  const fieldId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[440px] gap-4 overflow-hidden p-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
            <Share2 className="size-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <DialogHeader className="gap-1 hidden">
          <DialogTitle className="text-base font-medium leading-snug">
            Publish to client
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              Message to client
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  className="inline-flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <RiQuestionLine className="text-foreground-400 inline size-4" />
                </TooltipTrigger>
                <TooltipContent
                  variant="default"
                  className={cn("max-w-56 whitespace-pre-wrap")}
                  side="right"
                >
                  This is the message that will be sent to the document comment
                  section which clients can see this message.
                </TooltipContent>
              </Tooltip>
            </Label>

            <Textarea
              id={fieldId}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Edit the comment before sending..."
              className="min-h-[110px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border/60"
              disabled={isPending}
              maxLength={1000}
              required
            />

            <p className="text-xs text-muted-foreground text-right">
              {text.length}/1000
            </p>
          </div>
        </div>

        <div className="-mx-5 -mb-5 flex flex-row items-center justify-end gap-2 border-t bg-muted/50 px-5 py-4">
          <Button
            onClick={onSend}
            disabled={!text.trim() || isPending}
            className="flex items-center rounded-lg gap-2 bg-[#222222] text-background hover:bg-[#222222]/90 font-medium w-fit"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <RiLoader4Line className="size-4 animate-spin" />
                <span className="font-medium">Sending to client</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">Send to Client</span>
                <Kbd className="border border-white/30 bg-transparent ring-transparent px-0 size-4 justify-center items-center text-white">
                  <RiCornerDownLeftLine className="size-2.5 text-white" />
                </Kbd>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

