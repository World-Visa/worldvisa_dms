import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { Comment, AddCommentRequest, AddCommentResponse, DeleteCommentRequest, DeleteCommentResponse } from '@/types/comments';
import { tokenStorage } from '@/lib/auth';
import { commentMonitor } from '@/lib/commentMonitoring';
import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';
import { ZOHO_BASE_URL } from '@/lib/config/api';

export function useAddComment(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<AddCommentRequest, 'document_id'>): Promise<Comment> => {
      const startTime = Date.now();
      
      try {
        const response = await fetcher<AddCommentResponse>(
          `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/comments`,
          {
            method: 'POST',
            body: JSON.stringify({
              ...data,
              document_id: documentId
            })
          }
        );

        const responseTime = Date.now() - startTime;

        if (response.status === 'error') {
          throw new Error(response.message || 'Failed to add comment');
        }

        if (!response.data) {
          throw new Error('No comment data returned');
        }

        // Track successful comment creation
        commentMonitor.trackCommentCreated(data.added_by, responseTime);
        commentMonitor.reportPerformanceIssue('add_comment', responseTime);

        return response.data;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        commentMonitor.trackCommentError(error as Error, {
          documentId,
          addedBy: data.added_by,
          responseTime
        });
        throw error;
      }
    },
    
    onMutate: async (newComment) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['document-comments', documentId] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<Comment[]>(['document-comments', documentId]);

      // Get current user info from localStorage or token
      let currentUser = 'Unknown User';
      
      // First try localStorage (more reliable)
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.username) {
              currentUser = user.username;
            }
          } catch (error) {
            console.warn('Failed to parse user data from localStorage:', error);
          }
        }
      }
      
      // Fallback to JWT token
      if (currentUser === 'Unknown User') {
        const token = tokenStorage.get();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = payload.username || payload.email || payload.name || 'Unknown User';
          } catch (error) {
            console.warn('Failed to parse user from token:', error);
          }
        }
      }

      // Create optimistic comment
      const optimisticComment: Comment = {
        _id: `temp-${Date.now()}`, // Temporary ID
        comment: newComment.comment,
        added_by: newComment.added_by || currentUser,
        created_at: new Date().toISOString(),
        document_id: documentId,
        is_important: newComment.added_by?.toLowerCase().includes('moshin') || false
      };

      // Optimistically update the cache
      queryClient.setQueryData<Comment[]>(['document-comments', documentId], (old) => {
        if (!old) return [optimisticComment];
        
        // Add optimistic comment and sort by priority
        const newComments = [...old, optimisticComment];
        return sortCommentsByPriority(newComments);
      });

      // Return a context object with the snapshotted value
      return { previousComments, optimisticComment };
    },

    onError: (error, newComment, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousComments) {
        queryClient.setQueryData(['document-comments', documentId], context.previousComments);
      }

      // Log error to Sentry
      Sentry.captureException(error, {
        tags: {
          operation: 'add_comment_mutation',
          documentId
        },
        extra: {
          comment: newComment.comment,
          addedBy: newComment.added_by
        }
      });

      // Show error toast
      toast.error('Failed to add comment', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    },

    onSuccess: (data, variables, context) => {
      // Replace the optimistic comment with the real one from the server
      queryClient.setQueryData<Comment[]>(['document-comments', documentId], (old) => {
        if (!old) return [data];
        
        // Remove the optimistic comment and add the real one
        const filteredComments = old.filter(comment => comment._id !== context?.optimisticComment._id);
        const newComments = [...filteredComments, data];
        return sortCommentsByPriority(newComments);
      });

      // Show success toast
      toast.success('Comment added successfully');
    },

    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['document-comments', documentId] });
    },
  });
}

// Helper function to sort comments by priority
function sortCommentsByPriority(comments: Comment[]): Comment[] {
  return comments.sort((a, b) => {
    // Moshin's comments first
    const aIsMoshin = a.added_by.toLowerCase().includes('moshin');
    const bIsMoshin = b.added_by.toLowerCase().includes('moshin');
    
    if (aIsMoshin && !bIsMoshin) return -1;
    if (!aIsMoshin && bIsMoshin) return 1;
    
    // Then sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// Hook for comment validation
export function useCommentValidation() {
  const validateComment = (comment: string): { isValid: boolean; error?: string } => {
    if (!comment || comment.trim().length === 0) {
      return { isValid: false, error: 'Comment cannot be empty' };
    }

    if (comment.length > 1000) {
      return { isValid: false, error: 'Comment is too long (max 1000 characters)' };
    }

    return { isValid: true };
  };

  return { validateComment };
}

// Hook for deleting comments
export function useDeleteComment(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteCommentRequest): Promise<void> => {
      const startTime = Date.now();
      
      try {
        // Get current user info for authorization
        let currentUser = 'Unknown User';
        
        // First try localStorage (more reliable)
        if (typeof window !== 'undefined') {
          const userData = localStorage.getItem('user_data');
          if (userData) {
            try {
              const user = JSON.parse(userData);
              if (user.username) {
                currentUser = user.username;
              }
            } catch (error) {
              console.warn('Failed to parse user data from localStorage:', error);
            }
          }
        }
        
        // Fallback to JWT token
        if (currentUser === 'Unknown User') {
          const token = tokenStorage.get();
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              currentUser = payload.username || payload.email || payload.name || 'Unknown User';
            } catch (error) {
              console.warn('Failed to parse user from token:', error);
            }
          }
        }

        const response = await fetcher<DeleteCommentResponse>(
          `/api/zoho_dms/visa_applications/documents/${documentId}/comments`,
          {
            method: 'DELETE',
            body: JSON.stringify({
              ...data,
              addedBy: currentUser
            })
          }
        );

        const responseTime = Date.now() - startTime;

        if (response.status === 'error') {
          throw new Error(response.message || 'Failed to delete comment');
        }

        // Track successful comment deletion
        commentMonitor.trackCommentCreated('deleted', responseTime);
        commentMonitor.reportPerformanceIssue('delete_comment', responseTime);

      } catch (error) {
        const responseTime = Date.now() - startTime;
        commentMonitor.trackCommentError(error as Error, {
          documentId,
          commentId: data.commentId,
          responseTime
        });
        throw error;
      }
    },
    
    onMutate: async (deleteData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['document-comments', documentId] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<Comment[]>(['document-comments', documentId]);

      // Optimistically remove the comment from the cache
      queryClient.setQueryData<Comment[]>(['document-comments', documentId], (old) => {
        if (!old) return old;
        return old.filter(comment => comment._id !== deleteData.commentId);
      });

      // Return a context object with the snapshotted value
      return { previousComments };
    },

    onError: (error, deleteData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousComments) {
        queryClient.setQueryData(['document-comments', documentId], context.previousComments);
      }

      // Log error to Sentry
      Sentry.captureException(error, {
        tags: {
          operation: 'delete_comment_mutation',
          documentId
        },
        extra: {
          commentId: deleteData.commentId
        }
      });

      // Show error toast
      toast.error('Failed to delete comment', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    },

    onSuccess: () => {
      // Show success toast
      toast.success('Comment deleted successfully');
    },

    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['document-comments', documentId] });
    },
  });
}
