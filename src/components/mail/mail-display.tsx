"use client";

import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  CornerUpRight,
  Download,
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
import { Textarea } from "@/components/ui/textarea";
import { useEmailThread, useSingleEmail, useSendEmail, EMAIL_KEYS } from "@/hooks/useEmail";
import { useQueryClient } from "@tanstack/react-query";
import type { EmailMessage, EmailAttachment } from "@/types/email";
import { cn } from "@/lib/utils";

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

function AttachmentItem({ att }: { att: EmailAttachment }) {
  const sizeKb = Math.round(att.size / 1024);
  return (
    <a
      href={att.storage_url ?? "#"}
      download={att.filename}
      rel="noopener noreferrer"
      target="_blank"
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors max-w-[260px]">
      <Paperclip className="size-3 shrink-0 text-gray-400" />
      <span className="truncate font-medium text-gray-700 dark:text-gray-300">{att.filename}</span>
      <span className="ml-auto shrink-0 text-gray-400 whitespace-nowrap">{sizeKb} KB</span>
      <Download className="size-3 shrink-0 text-gray-400" />
    </a>
  );
}

function CollapsedMessage({ msg, onExpand }: { msg: EmailMessage; onExpand: () => void }) {
  const preview = (msg.text ?? "").slice(0, 90);
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
            {preview}
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
    <div className="border-b border-gray-100 dark:border-gray-800/60 last:border-b-0">
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
      <div className="px-6 pb-6 pl-[60px]">
        {msg.html ? (
          <div
            className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 [&_p]:mb-2 [&_a]:text-blue-600 [&_a:hover]:underline [&_br]:block"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized before render
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.html) }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {msg.text ?? ""}
          </div>
        )}
        {msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            {msg.attachments.map((att, i) => (
              <AttachmentItem key={`${i}-${att.filename}-${att.size}`} att={att} />
            ))}
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
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: send, isPending } = useSendEmail();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const replyTo = getEmail(lastMessage.from);
  const replySubject = lastMessage.subject.startsWith("Re:")
    ? lastMessage.subject
    : `Re: ${lastMessage.subject}`;

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || isPending) return;
    send(
      {
        to: replyTo,
        subject: replySubject,
        html: `<p>${trimmed.replace(/\n/g, "<br>")}</p>`,
        text: trimmed,
        in_reply_to: lastMessage.message_id,
        message_id: lastMessage.message_id,
      },
      {
        onSuccess: () => {
          setBody("");
          onClose();
          if (threadId) {
            queryClient.invalidateQueries({ queryKey: EMAIL_KEYS.thread(threadId) });
          }
        },
      }
    );
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

      {/* Body */}
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply…"
        className="min-h-[120px] max-h-[200px] resize-none rounded-none border-0 bg-transparent px-4 pt-3 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-300 dark:placeholder:text-gray-600"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-2.5">
        <span className="text-xs text-gray-300 dark:text-gray-600">⌘↵ to send</span>
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-full px-5 text-xs font-medium"
          onClick={handleSend}
          disabled={isPending || !body.trim()}>
          <Send className="size-3" />
          {isPending ? "Sending…" : "Send"}
        </Button>
      </div>
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
            <CornerUpRight className="size-4" />
            Forward
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
