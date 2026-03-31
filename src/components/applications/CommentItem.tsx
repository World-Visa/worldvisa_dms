import React from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Trash2, MoreVertical, FileText, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { Comment } from "@/types/comments";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
  isDeleting?: boolean;
  isClientView?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDelete,
  isDeleting = false,
}) => {
  const getSafeDocumentLink = (link?: string | null): string | null => {
    if (!link?.trim()) return null;
    try {
      const parsed = new URL(link);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  const getDocumentLabel = (link: string): string => {
    try {
      const pathSegment = new URL(link).pathname.split("/").pop();
      if (!pathSegment) return "Attached document";
      return decodeURIComponent(pathSegment) || "Attached document";
    } catch {
      return "Attached document";
    }
  };

  const { user } = useAuth();

  const isImportant =
    comment.is_important ||
    (comment.added_by ?? "").toLowerCase().includes("moshin");

  const isOwnMessage = user && comment.added_by === user.username;

  const canDelete =
    user &&
    (user.role === "admin" ||
      user.role === "team_leader" ||
      user.role === "master_admin" ||
      user.role === "supervisor" ||
      (user.role === "client" && comment.added_by === user.username));

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
  });
  const hasCommentText = Boolean(comment.comment?.trim());
  const documentLink = getSafeDocumentLink(comment.document_link);
  const hasDocumentLink = Boolean(documentLink);
  const safeProfileImageUrl = comment.profile_image_url?.trim() || null;

  return (
    <div
      className={cn(
        "group flex gap-2.5",
        isOwnMessage ? "ml-auto flex-row-reverse max-w-[85%]" : "mr-auto max-w-[85%]",
      )}
    >
      {/* Avatar for others' messages */}
      {!isOwnMessage && (
        <div className="mt-5 shrink-0">
          {safeProfileImageUrl ? (
            <div className="relative h-7 w-7 overflow-hidden rounded-full">
              <Image
                src={safeProfileImageUrl}
                alt={comment.added_by ?? "User"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
              <span className="text-[11px] font-medium uppercase text-muted-foreground">
                {(comment.added_by ?? "?").charAt(0)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1 min-w-0">
        {/* Name + time above bubble (others only) */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium text-foreground capitalize">
              {comment.added_by}
            </span>
            <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
          </div>
        )}

        {/* Message bubble */}
        <div className="relative flex items-start gap-1">
          <div
            className={cn(
              "relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[320px]",
              isOwnMessage
                ? "bg-foreground text-background rounded-br-sm"
                : isImportant
                  ? "bg-destructive/10 text-foreground border border-destructive/20 rounded-bl-sm"
                  : "bg-muted text-foreground rounded-bl-sm",
            )}
          >
            {hasDocumentLink && documentLink && (
              <a
                href={documentLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                  isOwnMessage
                    ? "border-background/30 bg-background/10 hover:bg-background/20"
                    : "border-border/60 bg-background/80 hover:bg-background",
                  hasCommentText && "mb-2",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    isOwnMessage ? "bg-white" : "bg-muted",
                  )}
                >
                  <Image src="/icons/pdf_small.svg" alt="File" width={16} height={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium leading-tight">
                    {getDocumentLabel(documentLink).slice(0, 20)}...
                  </p>
                  <p
                    className={cn(
                      "text-[11px] leading-tight",
                      isOwnMessage ? "text-background/70" : "text-muted-foreground",
                    )}
                  >
                    Document attachment
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            )}

            {hasCommentText && (
              <p className="whitespace-pre-wrap wrap-break-word">
                {comment.comment}
              </p>
            )}

            {/* Timestamp for own messages */}
            {isOwnMessage && (
              <p
                className={cn(
                  "text-[10px] mt-1.5",
                  isOwnMessage ? "text-background/50" : "text-muted-foreground",
                )}
              >
                {timeAgo}
              </p>
            )}
          </div>

          {/* Delete action on hover */}
          {canDelete && (
            <div
              className={cn(
                "shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                isOwnMessage ? "order-first" : "",
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted cursor-pointer"
                    disabled={isDeleting}
                  >
                    <MoreVertical className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? "start" : "end"}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive hover:bg-destructive/10 cursor-pointer"
                        disabled={isDeleting}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this comment? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(comment._id)}
                          className="bg-destructive cursor-pointer hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
