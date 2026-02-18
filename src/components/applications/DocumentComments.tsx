import React, { useRef, useEffect } from "react";
import { MessageCircle, AlertCircle } from "lucide-react";
import {
  useDocumentComments,
  useRealtimeConnection,
} from "@/hooks/useDocumentComments";
import { useDeleteComment } from "@/hooks/useCommentMutations";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import { cn } from "@/lib/utils";

interface DocumentCommentsProps {
  documentId: string;
  className?: string;
  isClientView?: boolean;
}

const DocumentComments: React.FC<DocumentCommentsProps> = ({
  documentId,
  className = "",
  isClientView = false,
}) => {
  const { comments, isLoading, error, refetch } =
    useDocumentComments(documentId);
  const connectionState = useRealtimeConnection();
  const deleteCommentMutation = useDeleteComment(documentId);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollEndRef.current && comments.length > 0) {
      scrollEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length]);

  const handleCommentAdded = () => {
    // Comment added successfully — scroll handled by useEffect
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync({ commentId });
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Comments</h3>
          {comments.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              ({comments.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              connectionState.isConnected
                ? "bg-green-500"
                : connectionState.isConnecting
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500",
            )}
          />
          <span className="text-[11px] text-muted-foreground">
            {connectionState.isConnected
              ? "Live"
              : connectionState.isConnecting
                ? "Connecting"
                : "Offline"}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Failed to load comments</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="underline ml-auto hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Comments list - scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2.5 animate-pulse",
                    i === 2 ? "ml-auto flex-row-reverse max-w-[75%]" : "mr-auto max-w-[75%]",
                  )}
                >
                  {i !== 2 && (
                    <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    {i !== 2 && (
                      <div className="h-3 bg-muted rounded w-20" />
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3",
                        i === 2 ? "bg-muted/60 rounded-br-sm" : "bg-muted rounded-bl-sm",
                      )}
                    >
                      <div className="h-3 bg-muted-foreground/10 rounded w-full mb-1.5" />
                      <div className="h-3 bg-muted-foreground/10 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Start the conversation
              </p>
            </div>
          ) : (
            [...comments]
              .sort((a, b) =>
                (a.created_at ?? "").localeCompare(b.created_at ?? ""),
              )
              .map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  onDelete={handleDeleteComment}
                  isDeleting={deleteCommentMutation.isPending}
                />
              ))
          )}
          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* Comment input at bottom */}
      <CommentForm
        documentId={documentId}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default DocumentComments;
