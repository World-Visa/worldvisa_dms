import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { fetcher } from '@/lib/fetcher';
import { realtimeManager } from '@/lib/realtime';
import { commentMonitor } from '@/lib/commentMonitoring';
import { Comment, CommentEvent, GetCommentsResponse } from '@/types/comments';

export function useDocumentComments(documentId: string) {
  const queryClient = useQueryClient();
  const isSubscribedRef = useRef(false);

  // Query for fetching comments
  const query = useQuery({
    queryKey: ['document-comments', documentId],
    queryFn: async (): Promise<Comment[]> => {
      const startTime = Date.now();
      
      try {
        const response = await fetcher<GetCommentsResponse>(
          `/api/zoho_dms/visa_applications/documents/${documentId}/comments`
        );
        
        const responseTime = Date.now() - startTime;
        
        if (response.status === 'error') {
          throw new Error(response.message || 'Failed to fetch comments');
        }
        
        const comments = response.data || [];
        
        // Track comment fetch performance
        commentMonitor.trackCommentFetch(documentId, responseTime, comments.length);
        commentMonitor.reportPerformanceIssue('fetch_comments', responseTime);
        
        return comments;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        commentMonitor.trackCommentError(error as Error, {
          documentId,
          operation: 'fetch_comments',
          responseTime
        });
        throw error;
      }
    },
    staleTime: 0, // Comments should always be fresh
    refetchOnWindowFocus: false,
    refetchInterval: false, // We'll use real-time updates instead
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!documentId || isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const unsubscribe = realtimeManager.subscribe(documentId, (event: CommentEvent) => {
      
      // Update the query cache with the new comment
      queryClient.setQueryData(['document-comments', documentId], (oldData: Comment[] | undefined) => {
        if (!oldData) return oldData;

        const existingComments = oldData || [];
        
        switch (event.type) {
          case 'comment_added':
            // Check if comment already exists to avoid duplicates
            const commentExists = existingComments.some(c => c._id === event.comment._id);
            if (!commentExists) {
              // Add new comment and sort by priority (Moshin's comments first, then by date)
              const newComments = [...existingComments, event.comment];
              return sortCommentsByPriority(newComments);
            }
            break;
            
          case 'comment_updated':
            return existingComments.map(comment => 
              comment._id === event.comment._id ? event.comment : comment
            );
            
          case 'comment_deleted':
            return existingComments.filter(comment => comment._id !== event.comment._id);
        }
        
        return existingComments;
      });
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [documentId, queryClient]);

  // Fallback polling when real-time is not available
  useEffect(() => {
    if (!documentId) return;

    const checkRealtimeStatus = () => {
      const isRealtimeConnected = realtimeManager.isConnected();
      
      if (!isRealtimeConnected && query.data) {
        // Enable polling as fallback
        queryClient.setQueryDefaults(['document-comments', documentId], {
          refetchInterval: 5000, // Poll every 5 seconds
        });
      } else if (isRealtimeConnected) {
        // Disable polling when real-time is connected
        queryClient.setQueryDefaults(['document-comments', documentId], {
          refetchInterval: false,
        });
      }
    };

    // Check initially
    checkRealtimeStatus();

    // Set up interval to check real-time status
    const statusCheckInterval = setInterval(checkRealtimeStatus, 10000); // Check every 10 seconds

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [documentId, queryClient, query.data]);

  return {
    ...query,
    comments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
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
    // Note: Zoho uses 'added_at' but we map it to 'created_at' in our API
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// Hook for real-time connection state
export function useRealtimeConnection() {
  const [connectionState, setConnectionState] = useState(
    realtimeManager.getConnectionState()
  );

  useEffect(() => {
    const unsubscribe = realtimeManager.onStateChange((newState) => {
      setConnectionState(newState);
      
      // Track connection state changes
      commentMonitor.trackRealtimeConnection(newState.isConnected);
      
      // Report high error rate if needed
      if (newState.error) {
        commentMonitor.reportHighErrorRate();
      }
    });
    
    return unsubscribe;
  }, []);

  return connectionState;
}
