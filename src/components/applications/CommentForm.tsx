import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Loader2 } from "lucide-react";
import {
  useAddComment,
  useCommentValidation,
} from "@/hooks/useCommentMutations";
import { useAuth } from "@/hooks/useAuth";
import { useClientApplication } from "@/hooks/useClientApplication";
import { isClientRole } from "@/lib/roles";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  documentId: string;
  onCommentAdded?: () => void;
  className?: string;
  applicationId?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  documentId,
  onCommentAdded,
  className = "",
}) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const addCommentMutation = useAddComment(documentId);
  const { validateComment } = useCommentValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const validation = validateComment(comment);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      await addCommentMutation.mutateAsync({
        comment: comment.trim(),
        added_by: user?.username ?? user?.role ?? "Unknown User",
      });

      setComment("");
      onCommentAdded?.();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled =
    isSubmitting || !comment.trim() || addCommentMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className={cn("p-3 border-t border-border/40 bg-background", className)}>
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Write a message..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-border/60 bg-muted/50 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/30"
          rows={1}
          disabled={isSubmitting}
          maxLength={1000}
        />
        <Button
          type="submit"
          disabled={isDisabled}
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
        >
          {isSubmitting || addCommentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {comment.length > 800 && (
        <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
          {1000 - comment.length} characters remaining
        </p>
      )}
      {addCommentMutation.error && (
        <p className="text-xs text-destructive mt-1.5 px-1">
          {addCommentMutation.error.message}
        </p>
      )}
    </form>
  );
};

export default CommentForm;
