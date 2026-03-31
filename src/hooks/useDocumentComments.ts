import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { realtimeManager, RequestedDocumentEvent } from "@/lib/realtime";
import { commentMonitor } from "@/lib/commentMonitoring";
import { Comment, CommentEvent, MessageEvent, ZohoComment } from "@/types/comments";
import { API_ENDPOINTS } from "@/lib/config/api";

export function useDocumentComments(documentId: string) {
  const queryClient = useQueryClient();
  const isSubscribedRef = useRef(false);

  // Query for fetching comments
  const query = useQuery({
    queryKey: ["document-comments", documentId],
    queryFn: async (): Promise<Comment[]> => {
      const startTime = Date.now();

      try {
        const raw = await fetcher<{ success: boolean; data: ZohoComment[] }>(
          API_ENDPOINTS.VISA_APPLICATIONS.DOCUMENTS.COMMENT(documentId),
        );

        const responseTime = Date.now() - startTime;

        if (!raw.success) {
          throw new Error("Failed to fetch comments");
        }

        const comments: Comment[] = (raw.data || [])
          .filter((c) => c.comment && c.comment.trim().length > 0)
          .map((c) => ({
            _id: c._id,
            comment: c.comment || "",
            added_by: c.added_by || "Unknown",
            created_at: c.added_at,
            document_id: documentId,
            document_link: c.document_link ?? null,
            profile_image_url: c.profile_image_url ?? null,
            is_important: Boolean(
              c.added_by?.toLowerCase().includes("moshin"),
            ),
          }));

        // Track comment fetch performance
        commentMonitor.trackCommentFetch(
          documentId,
          responseTime,
          comments.length,
        );
        commentMonitor.reportPerformanceIssue("fetch_comments", responseTime);

        return comments;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        commentMonitor.trackCommentError(error as Error, {
          documentId,
          operation: "fetch_comments",
          responseTime,
        });
        throw error;
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (!documentId || isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const unsubscribe = realtimeManager.subscribe(
      documentId,
      (event: CommentEvent | RequestedDocumentEvent | MessageEvent) => {
        queryClient.setQueryData(
          ["document-comments", documentId],
          (oldData: Comment[] | undefined) => {
            const existingComments = Array.isArray(oldData) ? oldData : [];

            switch (event.type) {
              case "comment_added":
                if (existingComments.length === 0) {
                  return sortCommentsByPriority([event.comment]);
                }
                const commentExists = existingComments.some(
                  (c) => c._id === event.comment._id,
                );
                if (!commentExists) {
                  const newComments = [...existingComments, event.comment];
                  return sortCommentsByPriority(newComments);
                }
                break;

              case "comment_updated":
                if (existingComments.length === 0) return oldData ?? [];
                return existingComments.map((comment) =>
                  comment._id === event.comment._id ? event.comment : comment,
                );

              case "comment_deleted":
                if (existingComments.length === 0) return oldData ?? [];
                return existingComments.filter(
                  (comment) => comment._id !== event.comment._id,
                );
            }

            return existingComments;
          },
        );
      },
    );

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [documentId, queryClient]);

  useEffect(() => {
    if (!documentId) return;

    const checkRealtimeStatus = () => {
      const isRealtimeConnected = realtimeManager.isConnected();

      if (!isRealtimeConnected && query.data) {
        queryClient.setQueryDefaults(["document-comments", documentId], {
          refetchInterval: 5000,
        });
      } else if (isRealtimeConnected) {
        queryClient.setQueryDefaults(["document-comments", documentId], {
          refetchInterval: false,
        });
      }
    };

    checkRealtimeStatus();

    const statusCheckInterval = setInterval(checkRealtimeStatus, 10000);

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

function sortCommentsByPriority(comments: Comment[]): Comment[] {
  return comments.sort((a, b) => {
    const aIsMoshin = (a.added_by ?? "").toLowerCase().includes("moshin");
    const bIsMoshin = (b.added_by ?? "").toLowerCase().includes("moshin");

    if (aIsMoshin && !bIsMoshin) return -1;
    if (!aIsMoshin && bIsMoshin) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function useRealtimeConnection() {
  const [connectionState, setConnectionState] = useState(
    realtimeManager.getConnectionState(),
  );

  useEffect(() => {
    const unsubscribe = realtimeManager.onStateChange((newState) => {
      setConnectionState(newState);

      commentMonitor.trackRealtimeConnection(newState.isConnected);

      if (newState.error) {
        commentMonitor.reportHighErrorRate();
      }
    });

    return unsubscribe;
  }, []);

  return connectionState;
}
