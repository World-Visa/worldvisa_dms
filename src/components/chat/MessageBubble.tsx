"use client";

import Image from "next/image";
import {
  MoreVertical,
  Trash2,
  Forward,
  CornerUpRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import type { ChatMessage } from "@/types/chat";
import { ReadTick } from "@/components/chat/ReadTick";
import { ImageSection, FileCard } from "@/components/chat/AttachmentGroup";

// ── Types ──────────────────────────────────────────────────────────────────

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  senderName: string;
  senderId: string;
  senderProfileImage?: string;
  showAvatar: boolean;
  showSenderName: boolean;
  /** Other participant's lastReadAt (from ConversationMember). DM only. */
  otherLastReadAt?: string | null;
  onDelete?: (messageId: string) => void;
  onForward?: (message: ChatMessage) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ── MessageBubble ──────────────────────────────────────────────────────────

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderId,
  senderProfileImage,
  showAvatar,
  showSenderName,
  otherLastReadAt,
  onDelete,
  onForward,
}: MessageBubbleProps) {
  const isDeleted = !!message.deletedAt;
  const hasActions = !isDeleted && (onDelete || onForward);
  const safeSenderProfileImage = senderProfileImage?.trim()
    ? senderProfileImage
    : undefined;

  const attachments = message.attachments ?? [];
  const imageAttachments = attachments.filter((a) =>
    a.contentType.startsWith("image/"),
  );
  const fileAttachments = attachments.filter(
    (a) => !a.contentType.startsWith("image/"),
  );
  const hasImages = imageAttachments.length > 0;
  const hasFiles = fileAttachments.length > 0;
  const hasContent = !!message.content;
  // Image-only: no text, no files — image IS the bubble card
  const isMediaOnly = hasImages && !hasContent && !hasFiles;

  const isRead =
    !!otherLastReadAt &&
    new Date(otherLastReadAt) >= new Date(message.createdAt);

  const bubbleCn = cn(
    "rounded-2xl text-sm overflow-hidden",
    isOwn
      ? "bg-foreground text-background rounded-br-sm"
      : "bg-muted text-foreground rounded-bl-sm",
  );

  // Timestamp + tick row — shown inside the content area
  const metaRow = (
    <div
      className={cn(
        "flex items-center gap-1.5 mt-1",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      <span
        className={cn(
          "text-[10px]",
          isOwn ? "text-background/50" : "text-muted-foreground",
        )}
      >
        {formatTime(message.createdAt)}
      </span>
      {isOwn && !isDeleted && <ReadTick isRead={isRead} />}
    </div>
  );

  return (
    <div
      className={cn(
        "group flex gap-2.5",
        isOwn ? "ml-auto flex-row-reverse max-w-[85%]" : "mr-auto max-w-[85%]",
      )}
    >
      {/* Sender avatar */}
      {!isOwn && (
        <div className="shrink-0 w-7">
          {showAvatar && (
            <div className="relative h-7 w-7 rounded-full overflow-hidden mt-5">
              <Image
                src={safeSenderProfileImage ?? getDefaultAvatarSrc(senderId)}
                alt={senderName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-0.5 min-w-0">
        {/* Sender name (group chats, others only) */}
        {!isOwn && showSenderName && (
          <p className="text-xs font-medium text-foreground capitalize px-1">
            {senderName}
          </p>
        )}

        {/* Forwarded label */}
        {message.forwardedFromMessageId && (
          <div
            className={cn(
              "flex items-center gap-1 px-1 text-[11px] text-muted-foreground",
              isOwn && "justify-end",
            )}
          >
            <CornerUpRight className="h-3 w-3" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Bubble row: [actions] [bubble] or [bubble] [actions] */}
        <div
          className={cn(
            "flex items-end gap-1",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          {/* Hover action menu */}


          {/* ── The bubble itself ── */}
          {isDeleted ? (
            <div className={cn(bubbleCn, "px-3.5 py-2.5 opacity-50 italic")}>
              <p className="text-xs">This message was deleted</p>
            </div>
          ) : isMediaOnly ? (
            /* Image-only: image IS the card, timestamp overlaid */
            <div className="rounded-2xl overflow-hidden relative min-w-[160px] max-w-[260px]">
              <ImageSection images={imageAttachments} />
              {isOwn && (
                <div className="absolute bottom-1.5 right-2 flex items-center gap-1 bg-black/40 rounded-full px-1.5 py-0.5">
                  <span className="text-[10px] text-white/90">
                    {formatTime(message.createdAt)}
                  </span>
                  <ReadTick isRead={isRead} className="text-white/90" />
                </div>
              )}
            </div>
          ) : (
            /* Text / files / mixed: single bubble */
            <div className={cn(bubbleCn, "max-w-[320px]")}>
              {/* Images bleed edge-to-edge at top */}
              {hasImages && <ImageSection images={imageAttachments} />}

              {/* Content area */}
              <div className="px-3.5 py-2.5">
                {hasContent && (
                  <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {message.content}
                  </p>
                )}
                {hasFiles && (
                  <div className={cn("space-y-1.5", hasContent && "mt-2")}>
                    {fileAttachments.map((att, i) => (
                      <FileCard key={i} attachment={att} isOwn={isOwn} />
                    ))}
                  </div>
                )}
                {metaRow}
              </div>
            </div>
          )}

          {hasActions && (
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={"center"} className="rounded-2xl">
                  {onForward && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      variant="default"
                      onSelect={() => onForward(message)}
                    >
                      <Forward className="h-3 w-3 mr-1" />
                      Forward
                    </DropdownMenuItem>
                  )}
                  {isOwn && onDelete && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      variant="destructive"
                      onSelect={() => onDelete(message._id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
