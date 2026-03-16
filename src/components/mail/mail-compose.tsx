"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMailStore } from "@/store/mailStore";
import { useSendEmail } from "@/hooks/useEmail";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichMailEditor, isEditorEmpty, stripTags } from "@/components/mail/rich-mail-editor";
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
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: send, isPending } = useSendEmail();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isComposeOpen && composeDraft) {
      setTo(composeDraft.to);
      setSubject(composeDraft.subject);
      setBodyHtml("");
    }
  }, [isComposeOpen, composeDraft]);

  const handleSend = () => {
    const trimmedTo = to.trim();
    if (!trimmedTo || isEditorEmpty(bodyHtml)) return;

    send(
      {
        to: trimmedTo,
        subject: subject.trim() || "(no subject)",
        html: bodyHtml,
        text: stripTags(bodyHtml),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        in_reply_to: composeDraft?.inReplyTo,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      {
        onSuccess: () => {
          setTo("");
          setCc("");
          setBcc("");
          setShowCc(false);
          setShowBcc(false);
          setSubject("");
          setBodyHtml("");
          setAttachments([]);
          clearComposeDraft();
          closeCompose();
        },
      }
    );
  };

  const handleClose = () => {
    setTo("");
    setCc("");
    setBcc("");
    setShowCc(false);
    setShowBcc(false);
    setSubject("");
    setBodyHtml("");
    setAttachments([]);
    clearComposeDraft();
    closeCompose();
  };

  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = !isPending && !!to.trim() && !isEditorEmpty(bodyHtml);

  return (
    <AnimatePresence>
      {isComposeOpen && (
        <motion.div
          key="compose"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-background shadow-2xl",
            isMobile
              ? "inset-0 rounded-none border-0"
              : "bottom-0 right-6 w-[620px] rounded-t-xl border"
          )}
          initial={{ y: "100%", opacity: 0 }}
          animate={isMobile
            ? { y: 0, opacity: 1, height: "100%" }
            : { y: 0, opacity: 1, height: composeState === "minimized" ? 48 : 560 }
          }
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}>

          {/* Header — always visible */}
          <div
            className="flex h-12 shrink-0 cursor-pointer select-none items-center justify-between rounded-t-xl bg-foreground px-4"
            onClick={composeState === "minimized" ? maximizeCompose : undefined}>
            <span className="text-sm font-medium text-background">New Message</span>
            <div className="flex items-center gap-1">
              {!isMobile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    composeState === "minimized" ? maximizeCompose() : minimizeCompose();
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded text-background/70 hover:bg-white/10 hover:text-background transition-colors">
                  <Minus className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                className="flex h-7 w-7 items-center justify-center rounded text-background/70 hover:bg-white/10 hover:text-background transition-colors">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Body — invisible when minimized (stays mounted to preserve draft); always visible on mobile */}
          <div className={cn("flex flex-1 flex-col overflow-hidden", !isMobile && composeState === "minimized" && "invisible")}>

            {/* To row */}
            <div className="flex items-center border-b px-4">
              <span className="shrink-0 text-xs text-muted-foreground w-10">To</span>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients"
                className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              />
              <div className="flex shrink-0 items-center gap-1 ml-1">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded">
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded">
                    Bcc
                  </button>
                )}
              </div>
            </div>

            {/* Cc row */}
            {showCc && (
              <div className="flex items-center border-b px-4">
                <span className="shrink-0 text-xs text-muted-foreground w-10">Cc</span>
                <Input
                  autoFocus
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Cc"
                  className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  aria-label="Remove Cc"
                  onClick={() => { setShowCc(false); setCc(""); }}
                  className="shrink-0 ml-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <X className="size-3" />
                </button>
              </div>
            )}

            {/* Bcc row */}
            {showBcc && (
              <div className="flex items-center border-b px-4">
                <span className="shrink-0 text-xs text-muted-foreground w-10">Bcc</span>
                <Input
                  autoFocus={!showCc}
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Bcc"
                  className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  aria-label="Remove Bcc"
                  onClick={() => { setShowBcc(false); setBcc(""); }}
                  className="shrink-0 ml-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <X className="size-3" />
                </button>
              </div>
            )}

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

            {/* Rich text editor */}
            <RichMailEditor
              content={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Write your message…"
              minHeight={isMobile ? "200px" : "260px"}
              className="flex-1 overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t px-4 py-2">
                {attachments.map((file, i) => (
                  <span
                    key={`${file.name}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    <Paperclip className="size-3 shrink-0" />
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeAttachment(i)}
                      className="ml-0.5 rounded-full hover:text-foreground transition-colors">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex h-12 shrink-0 items-center justify-between border-t px-3">
              <button
                type="button"
                aria-label="Attach files"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Paperclip className="size-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60">⌘↵ to send</span>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-full px-4 text-xs"
                  onClick={handleSend}
                  disabled={!canSend}>
                  <Send className="size-3" />
                  {isPending ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden file input for attachments */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleAttachFiles}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
