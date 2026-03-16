"use client";

import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  CornerUpRight,
  MessageSquare,
  MousePointerClickIcon,
  Paperclip,
  Reply,
  Send,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmailThread, useSingleEmail, useSendEmail, EMAIL_KEYS } from "@/hooks/useEmail";
import { useQueryClient } from "@tanstack/react-query";
import type { EmailMessage, EmailAttachment } from "@/types/email";
import { cn } from "@/lib/utils";
import { RichMailEditor, isEditorEmpty, stripTags } from "@/components/mail/rich-mail-editor";
import { FileTypeIcon, getFileTypeLabel } from "@/components/mail/file-type-icon";

interface MailDisplayProps {
  id: string | null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
}

function getInitials(from: string): string {
  const name = from.match(/^([^<]+)</)?.[1]?.trim() ?? from;
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function getDisplayName(from: string): string {
  return from.match(/^([^<]+)</)?.[1]?.trim() ?? from;
}

function getEmail(from: string): string {
  return from.match(/<([^>]+)>/)?.[1] ?? from;
}

function formatDate(dateStr: string | null, fallback: string): string {
  return format(new Date(dateStr ?? fallback), "MMM d, yyyy 'at' h:mm a");
}

function formatShortDate(dateStr: string | null, fallback: string): string {
  const d = new Date(dateStr ?? fallback);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return format(d, "h:mm a");
  if (d.getFullYear() === now.getFullYear()) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
];

function avatarColor(from: string): string {
  let hash = 0;
  for (let i = 0; i < from.length; i++) hash = (hash * 31 + from.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── sub-components ─────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return "< 1 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentItem({ att }: { att: EmailAttachment }) {
  const available = !!att.storage_key && !!att.url;
  const label = getFileTypeLabel(att.content_type);
  const size = formatFileSize(att.size);

  const inner = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150 min-w-0 w-full",
        available
          ? "border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 cursor-pointer"
          : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 cursor-not-allowed opacity-50"
      )}>
      <div className="shrink-0 size-9">
        <FileTypeIcon contentType={att.content_type} className="size-9" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[13px] font-medium truncate leading-snug",
          available
            ? "text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white"
            : "text-gray-400 dark:text-gray-600"
        )}>
          {att.filename}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
          {available ? `${label} · ${size}` : `${label} · Upload failed`}
        </p>
      </div>
      {available && (
        <div className="shrink-0 ml-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 1v5M5 6L2.5 3.5M5 6L7.5 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400" />
              <path d="M1.5 8h7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-gray-500 dark:text-gray-400" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );

  if (!available) return inner;

  return (
    <a
      href={att.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      title={`Download ${att.filename}`}
      className="block min-w-0">
      {inner}
    </a>
  );
}

function CollapsedMessage({ msg, onExpand }: { msg: EmailMessage; onExpand: () => void }) {
  const preview = (msg.text ?? "").slice(0, 60);
  const initials = getInitials(msg.from);
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/3 transition-colors group border-b border-gray-100 dark:border-gray-800/60 last:border-b-0">
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-medium select-none",
        avatarColor(msg.from)
      )}>
        {initials}
      </div>
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {getDisplayName(msg.from)}
        </span>
        {preview && (
          <span className="min-w-0 truncate text-sm text-gray-400 dark:text-gray-500">
            {preview} ....
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <Star className="size-[15px] text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-yellow-400" />
        <time className="text-xs text-gray-400 dark:text-gray-500 tabular-nums whitespace-nowrap">
          {formatShortDate(msg.received_at, msg.created_at)}
        </time>
        <ChevronDown className="size-3.5 text-gray-300 dark:text-gray-600" />
      </div>
    </button>
  );
}

function ExpandedMessage({ msg, onCollapse }: { msg: EmailMessage; onCollapse: () => void }) {
  const initials = getInitials(msg.from);
  return (
    <div className="border-b max-w-[840px] border-gray-100 dark:border-gray-800/60 last:border-b-0">
      {/* Clickable header */}
      <button
        type="button"
        onClick={onCollapse}
        className="flex w-full items-start gap-3 px-6 py-3 text-left hover:bg-gray-50/70 dark:hover:bg-white/2 transition-colors group">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-medium select-none mt-0.5",
          avatarColor(msg.from)
        )}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {getDisplayName(msg.from)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                to {msg.to && msg.to.length > 0 ? msg.to.join(", ") : getEmail(msg.from)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Star className="size-[15px] text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <time className="text-xs text-gray-400 dark:text-gray-500 tabular-nums whitespace-nowrap">
                {formatDate(msg.received_at, msg.created_at)}
              </time>
              <ChevronUp className="size-3.5 text-gray-300 dark:text-gray-600" />
            </div>
          </div>
        </div>
      </button>

      {/* Email body */}
      <div className="px-4 pb-6 pl-[52px] min-w-0 overflow-hidden">
        {msg.html ? (
          <div
            className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 [&_p]:mb-2 [&_a]:text-blue-600 [&_a:hover]:underline [&_br]:block max-w-full overflow-x-hidden [&_table]:max-w-full [&_table]:w-full [&_table]:table-fixed [&_img]:max-w-full **:box-border **:max-w-full"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized before render
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.html) }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200 wrap-break-word">
            {msg.text ?? ""}
          </div>
        )}
        {msg.attachments.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-2.5">
              {msg.attachments.length} attachment{msg.attachments.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
              {msg.attachments.map((att, i) => (
                <AttachmentItem key={`${i}-${att.filename}-${att.size}`} att={att} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── reply tray ──────────────────────────────────────────────────────────────

function ReplyTray({
  lastMessage,
  threadId,
  onClose,
}: {
  lastMessage: EmailMessage;
  threadId: string | null;
  onClose: () => void;
}) {
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: send, isPending } = useSendEmail();
  const queryClient = useQueryClient();

  const replyTo = getEmail(lastMessage.from);
  const replySubject = lastMessage.subject.startsWith("Re:")
    ? lastMessage.subject
    : `Re: ${lastMessage.subject}`;

  const handleSend = () => {
    if (isEditorEmpty(bodyHtml) || isPending) return;
    send(
      {
        to: replyTo,
        subject: replySubject,
        html: bodyHtml,
        text: stripTags(bodyHtml),
        in_reply_to: lastMessage.message_id,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      {
        onSuccess: () => {
          setBodyHtml("");
          setAttachments([]);
          onClose();
          if (threadId) {
            queryClient.invalidateQueries({ queryKey: EMAIL_KEYS.thread(threadId) });
          }
        },
      }
    );
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

  return (
    <div className="shrink-0 border border-gray-200 dark:border-gray-700 rounded-2xl mx-4 mb-4 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reply</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <X className="size-3.5" />
        </button>
      </div>

      {/* To / Subject */}
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-50 dark:border-gray-800/50">
          <span className="text-xs font-medium text-gray-400 w-12 shrink-0">To</span>
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{replyTo}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-xs font-medium text-gray-400 w-12 shrink-0">Subject</span>
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{replySubject}</span>
        </div>
      </div>

      {/* Rich text editor */}
      <RichMailEditor
        content={bodyHtml}
        onChange={setBodyHtml}
        placeholder="Write your reply…"
        minHeight="120px"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-gray-100 dark:border-gray-800 px-4 py-2">
          {attachments.map((file, i) => (
            <span
              key={`${file.name}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border bg-gray-50 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
              <Paperclip className="size-3 shrink-0" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => removeAttachment(i)}
                className="ml-0.5 rounded-full hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach files"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Paperclip className="size-3.5" />
          </button>
          <span className="text-xs text-gray-300 dark:text-gray-600">⌘↵ to send</span>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-full px-5 text-xs font-medium"
          onClick={handleSend}
          disabled={isPending || isEditorEmpty(bodyHtml)}>
          <Send className="size-3" />
          {isPending ? "Sending…" : "Send"}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAttachFiles}
      />
    </div>
  );
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function ThreadSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <Skeleton className="h-6 w-2/3 mb-2" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-800">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function MailDisplay({ id }: MailDisplayProps) {
  const threadId = id?.startsWith("t-") ? id.slice(2) : null;
  const messageId = id?.startsWith("m-") ? id.slice(2) : null;

  const threadQuery = useEmailThread(threadId ?? "", !!threadId);
  const singleQuery = useSingleEmail(messageId ?? "", !!messageId);

  const messages: EmailMessage[] =
    threadQuery.data?.data ?? (singleQuery.data ? [singleQuery.data] : []);

  const isLoading = threadQuery.isLoading || singleQuery.isLoading;
  const isError = threadQuery.isError || singleQuery.isError;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [replyOpen, setReplyOpen] = useState(false);
  const initializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length > 0 && initializedRef.current !== id) {
      initializedRef.current = id;
      setExpandedIds(new Set([messages[messages.length - 1]._id]));
      setReplyOpen(false);
    }
  }, [messages, id]);

  const toggleExpanded = (msgId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // ── empty state ──
  if (!id) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
          <MousePointerClickIcon className="size-6 text-gray-300 dark:text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No email selected</p>
          <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">Choose an email from the list</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <ThreadSkeleton />;

  if (isError || messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-gray-400">Failed to load email. Try again.</p>
      </div>
    );
  }

  const lastMessage = messages[messages.length - 1];
  const subject = messages[0].subject;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-background overflow-hidden">

      {/* ── Subject header ── */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-[17px] font-semibold leading-snug text-gray-900 dark:text-gray-100">
          {subject}
        </h2>
        {messages.length > 1 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {messages.length} messages
          </p>
        )}
      </div>

      {/* ── Messages list (scrollable) ── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="py-1">
          {messages.map((msg) => {
            const isExpanded = expandedIds.has(msg._id);
            return (
              <div key={msg._id}>
                {isExpanded ? (
                  <ExpandedMessage
                    msg={msg}
                    onCollapse={() => {
                      if (messages.length > 1) toggleExpanded(msg._id);
                    }}
                  />
                ) : (
                  <CollapsedMessage msg={msg} onExpand={() => toggleExpanded(msg._id)} />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* ── Reply tray (slides up) ── */}
      <AnimatePresence>
        {replyOpen && (
          <motion.div
            key="reply-tray"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 42 }}>
            <ReplyTray
              lastMessage={lastMessage}
              threadId={threadId}
              onClose={() => setReplyOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom action pills ── */}
      {!replyOpen && (
        <div className="shrink-0 flex items-center gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-transparent px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors shadow-sm">
            <Reply className="size-4" />
            Reply
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-transparent px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors shadow-sm">
            <MessageSquare className="size-4" />
            Share in chat
          </button>
        </div>
      )}

    </div>
  );
}
