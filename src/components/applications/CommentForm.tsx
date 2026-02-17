import React, { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Loader2 } from "lucide-react";
import {
  useAddComment,
  useCommentValidation,
} from "@/hooks/useCommentMutations";
import { tokenStorage } from "@/lib/auth";
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

  const addCommentMutation = useAddComment(documentId);
  const { validateComment } = useCommentValidation();

  const getCurrentUser = useCallback(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user_data");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.username) {
            return user.username;
          }
        } catch (error) {
          console.warn("Failed to parse user data from localStorage:", error);
        }
      }
    }

    const token = tokenStorage.get();
    if (!token) return "Unknown User";

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return (
        payload.username ||
        payload.email ||
        payload.name ||
        payload.user?.username ||
        payload.user?.email ||
        payload.user?.name ||
        "Unknown User"
      );
    } catch (error) {
      console.warn("Failed to parse user from token:", error);
      return "Unknown User";
    }
  }, []);

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
        added_by: getCurrentUser(),
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
