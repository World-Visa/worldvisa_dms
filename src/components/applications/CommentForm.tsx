import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useAddComment, useCommentValidation } from '@/hooks/useCommentMutations';
import { tokenStorage } from '@/lib/auth';
import { toast } from 'sonner';

interface CommentFormProps {
  documentId: string;
  onCommentAdded?: () => void;
  className?: string;
  applicationId?:string;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  documentId, 
  onCommentAdded,
  className = '' 
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const addCommentMutation = useAddComment(documentId);
  const { validateComment } = useCommentValidation();

  // Get current user info from token or localStorage
  const getCurrentUser = useCallback(() => {
    // First try to get from localStorage (more reliable)
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log('User data from localStorage:', user);
          if (user.username) {
            return user.username;
          }
        } catch (error) {
          console.warn('Failed to parse user data from localStorage:', error);
        }
      }
    }
    
    // Fallback to JWT token
    const token = tokenStorage.get();
    if (!token) return 'Unknown User';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT Payload for user name:', payload);
      
      // Try multiple possible fields for user identification
      return payload.username || 
             payload.email || 
             payload.name || 
             payload.user?.username ||
             payload.user?.email ||
             payload.user?.name ||
             'Unknown User';
    } catch (error) {
      console.warn('Failed to parse user from token:', error);
      return 'Unknown User';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validate comment
    const validation = validateComment(comment);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      await addCommentMutation.mutateAsync({
        comment: comment.trim(),
        added_by: getCurrentUser()
      });

      // Clear form
      setComment('');
      
      // Call callback if provided
      onCommentAdded?.();
      
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = isSubmitting || !comment.trim() || addCommentMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment... (Ctrl+Enter to send)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          rows={3}
          disabled={isSubmitting}
          maxLength={1000}
        />
        
        {/* Character count */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {comment.length}/1000 characters
          </span>
          {comment.length > 800 && (
            <span className="text-amber-600">
              {1000 - comment.length} characters remaining
            </span>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit"
          disabled={isDisabled}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 min-w-[100px]"
        >
          {isSubmitting || addCommentMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </div>
      
      {/* Error display */}
      {addCommentMutation.error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {addCommentMutation.error.message}
        </div>
      )}
    </form>
  );
};

export default CommentForm;
