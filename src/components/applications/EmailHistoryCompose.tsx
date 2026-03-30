"use client";

import { motion } from "motion/react";
import { Minus, Paperclip, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichMailEditor, isEditorEmpty, stripTags } from "@/components/mail/rich-mail-editor";
import { useSendEmail } from "@/hooks/useEmail";
import { cn } from "@/lib/utils";

interface EmailHistoryComposeProps {
  defaultTo: string;
  onClose: () => void;
}

export function EmailHistoryCompose({ defaultTo, onClose }: EmailHistoryComposeProps) {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [minimized, setMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: send, isPending } = useSendEmail();

  const canSend = !isPending && !!to.trim() && !isEditorEmpty(bodyHtml);

  const handleSend = () => {
    if (!canSend) return;
    send(
      {
        to: to.trim(),
        subject: subject.trim() || "(no subject)",
        html: bodyHtml,
        text: stripTags(bodyHtml),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      { onSuccess: onClose },
    );
  };

  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      className="absolute bottom-0 right-0 z-20 flex w-full flex-col overflow-hidden rounded-t-xl border bg-background shadow-2xl sm:w-[520px]"
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1, height: minimized ? 48 : 480 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-12 shrink-0 cursor-pointer select-none items-center justify-between rounded-t-xl bg-foreground px-4",
          minimized && "cursor-pointer",
        )}
        onClick={minimized ? () => setMinimized(false) : undefined}
      >
        <span className="text-sm font-medium text-background">New Message</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMinimized((v) => !v);
            }}
            className="flex h-7 w-7 items-center justify-center rounded text-background/70 hover:bg-white/10 hover:text-background transition-colors"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex h-7 w-7 items-center justify-center rounded text-background/70 hover:bg-white/10 hover:text-background transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Body — hidden when minimized but stays mounted */}
      <div className={cn("flex flex-1 flex-col overflow-hidden", minimized && "invisible")}>
        {/* To */}
        <div className="flex items-center border-b px-4">
          <span className="w-10 shrink-0 text-xs text-muted-foreground">To</span>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Recipients"
            className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
          <div className="ml-1 flex shrink-0 items-center gap-1">
            {!showCc && (
              <button type="button" onClick={() => setShowCc(true)} className="rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                Cc
              </button>
            )}
            {!showBcc && (
              <button type="button" onClick={() => setShowBcc(true)} className="rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                Bcc
              </button>
            )}
          </div>
        </div>

        {/* Cc */}
        {showCc && (
          <div className="flex items-center border-b px-4">
            <span className="w-10 shrink-0 text-xs text-muted-foreground">Cc</span>
            <Input autoFocus value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Cc" className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50" />
            <button type="button" aria-label="Remove Cc" onClick={() => { setShowCc(false); setCc(""); }} className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-muted-foreground">
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Bcc */}
        {showBcc && (
          <div className="flex items-center border-b px-4">
            <span className="w-10 shrink-0 text-xs text-muted-foreground">Bcc</span>
            <Input autoFocus={!showCc} value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="Bcc" className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50" />
            <button type="button" aria-label="Remove Bcc" onClick={() => { setShowBcc(false); setBcc(""); }} className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-muted-foreground">
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center border-b px-4">
          <span className="w-10 shrink-0 text-xs text-muted-foreground">Sub</span>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50" />
        </div>

        {/* Rich text editor */}
        <RichMailEditor
          content={bodyHtml}
          onChange={setBodyHtml}
          placeholder="Write your message…"
          minHeight="160px"
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
                className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                <Paperclip className="size-3 shrink-0" />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeAttachment(i)} className="ml-0.5 rounded-full transition-colors hover:text-foreground">
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
            className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Paperclip className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60">⌘↵ to send</span>
            <Button size="sm" className="h-8 gap-1.5 rounded-full px-4 text-xs" onClick={handleSend} disabled={!canSend}>
              <Send className="size-3" />
              {isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachFiles} />
    </motion.div>
  );
}
