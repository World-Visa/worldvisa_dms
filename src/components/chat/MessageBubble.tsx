"use client";

import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  MoreVertical,
  Trash2,
  Forward,
  CornerUpRight,
  FileIcon,
  Download,
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

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  senderName: string;
  senderId: string;
  senderProfileImage?: string;
  showAvatar: boolean;
  showSenderName: boolean;
  onDelete?: (messageId: string) => void;
  onForward?: (message: ChatMessage) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderId,
  senderProfileImage,
  showAvatar,
  showSenderName,
  onDelete,
  onForward,
}: MessageBubbleProps) {
  const isDeleted = !!message.deletedAt;
  const hasActions = !isDeleted && (onDelete || onForward);

  return (
    <div
      className={cn(
        "group flex gap-2.5",
        isOwn ? "ml-auto flex-row-reverse max-w-[85%]" : "mr-auto max-w-[85%]",
      )}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="shrink-0 w-7">
          {showAvatar && (
            <div className="relative h-7 w-7 rounded-full overflow-hidden mt-5">
              <Image
                src={senderProfileImage ?? getDefaultAvatarSrc(senderId)}
                alt={senderName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-1 min-w-0">
        {/* Sender name + time (others only) */}
        {!isOwn && showSenderName && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium text-foreground capitalize">
              {senderName}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {timeAgo(message.createdAt)}
            </span>
          </div>
        )}

        {/* Forwarded indicator */}
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

        {/* Bubble + actions */}
        <div className="relative flex items-start gap-1">
          <div
            className={cn(
              "relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              isOwn
                ? "bg-foreground text-background rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm",
              isDeleted && "opacity-50 italic",
            )}
          >
            {isDeleted ? (
              <p className="text-xs">This message was deleted</p>
            ) : (
              <>
                {message.content && (
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {message.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors",
                          isOwn
                            ? "bg-background/15 hover:bg-background/25 text-background"
                            : "bg-background/50 hover:bg-background/80 text-foreground",
                        )}
                      >
                        <FileIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1 max-w-[180px]">
                          {att.name}
                        </span>
                        <span className="text-[10px] opacity-60 shrink-0">
                          {formatFileSize(att.size)}
                        </span>
                        <Download className="h-3 w-3 shrink-0 opacity-60" />
                      </a>
                    ))}
                  </div>
                )}

                {isOwn && (
                  <p
                    className={cn(
                      "text-[10px] mt-1.5",
                      isOwn ? "text-background/50" : "text-muted-foreground",
                    )}
                  >
                    {timeAgo(message.createdAt)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Hover actions */}
          {hasActions && (
            <div
              className={cn(
                "shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 self-center",
                isOwn ? "order-first" : "",
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "start" : "end"}>
                  {onForward && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => onForward(message)}
                    >
                      <Forward className="h-3 w-3 mr-2" />
                      Forward
                    </DropdownMenuItem>
                  )}
                  {isOwn && onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onSelect={() => onDelete(message._id)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
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
