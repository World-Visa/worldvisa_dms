"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bold, Italic, Link, Minus, Paperclip, Send, Underline, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMailStore } from "@/store/mailStore";
import { useSendEmail } from "@/hooks/useEmail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ComposeOverlay() {
  const {
    isComposeOpen,
    composeState,
    closeCompose,
    minimizeCompose,
    maximizeCompose,
    composeDraft,
    clearComposeDraft,
  } = useMailStore();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { mutate: send, isPending } = useSendEmail();

  // Sync draft into local state when compose opens (e.g. for reply pre-fill)
  useEffect(() => {
    if (isComposeOpen && composeDraft) {
      setTo(composeDraft.to);
      setSubject(composeDraft.subject);
      setBody("");
    }
  }, [isComposeOpen, composeDraft]);

  const handleSend = () => {
    const trimmedTo = to.trim();
    const trimmedBody = body.trim();
    if (!trimmedTo || !trimmedBody) return;

    send(
      {
        to: trimmedTo,
        subject: subject.trim() || "(no subject)",
        html: `<p>${trimmedBody.replace(/\n/g, "<br>")}</p>`,
        text: trimmedBody,
        in_reply_to: composeDraft?.inReplyTo,
        message_id: composeDraft?.inReplyTo,
      },
      {
        onSuccess: () => {
          setTo("");
          setSubject("");
          setBody("");
          clearComposeDraft();
          closeCompose();
        },
      }
    );
  };

  const handleClose = () => {
    setTo("");
    setSubject("");
    setBody("");
    clearComposeDraft();
    closeCompose();
  };

  return (
    <AnimatePresence>
      {isComposeOpen && (
        <motion.div
          key="compose"
          className="fixed bottom-0 right-6 z-50 flex w-[520px] flex-col overflow-hidden rounded-t-xl border bg-background shadow-2xl"
          initial={{ y: "100%", opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            height: composeState === "minimized" ? 48 : 500,
          }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}>

          {/* Header — always visible */}
          <div
            className="flex h-12 shrink-0 cursor-pointer select-none items-center justify-between rounded-t-xl bg-foreground px-4"
            onClick={composeState === "minimized" ? maximizeCompose : undefined}>
            <span className="text-sm font-medium text-background">New Message</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  composeState === "minimized" ? maximizeCompose() : minimizeCompose();
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-background/70 hover:bg-white/10 hover:text-background transition-colors">
                <Minus className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                className="flex h-7 w-7 items-center justify-center rounded text-background/70 hover:bg-white/10 hover:text-background transition-colors">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Body — invisible when minimized (stays mounted to preserve draft) */}
          <div className={cn("flex flex-1 flex-col overflow-hidden", composeState === "minimized" && "invisible")}>
            {/* Recipients */}
            <div className="flex items-center border-b px-4">
              <span className="shrink-0 text-xs text-muted-foreground w-10">To</span>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients"
                className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Subject */}
            <div className="flex items-center border-b px-4">
              <span className="shrink-0 text-xs text-muted-foreground w-10">Sub</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Body */}
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="flex-1 resize-none rounded-none border-0 bg-transparent px-5 py-4 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <Separator />

            {/* Footer toolbar */}
            <div className="flex h-12 shrink-0 items-center justify-between px-3">
              <div className="flex items-center gap-1">
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Bold className="size-4" />
                </button>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Italic className="size-4" />
                </button>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Underline className="size-4" />
                </button>
                <div className="mx-1 h-5 w-px bg-border" />
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Paperclip className="size-4" />
                </button>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Link className="size-4" />
                </button>
              </div>

              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-full px-4 text-xs"
                onClick={handleSend}
                disabled={isPending || !to.trim() || !body.trim()}>
                <Send className="size-3" />
                {isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
