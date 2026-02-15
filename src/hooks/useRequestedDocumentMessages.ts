import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  getRequestedDocumentMessages,
  sendRequestedDocumentMessage,
  deleteRequestedDocumentMessage,
  SendMessageRequest,
  SendMessageResponse,
  DeleteMessageRequest,
  RequestedDocumentMessage,
  RequestedDocumentMessagesResponse,
} from "@/lib/api/requestedDocumentMessages";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { realtimeManager } from "@/lib/realtime";
import { MessageEvent } from "@/types/comments";

/**
 * Hook to fetch messages for a requested document review
 */
export function useRequestedDocumentMessages(
  documentId: string,
  reviewId: string,
) {
  return useQuery({
    queryKey: ["requested-document-messages", documentId, reviewId],
    queryFn: () => getRequestedDocumentMessages(documentId, reviewId),
    enabled: !!documentId && !!reviewId,
    staleTime: 0, // Always fresh (rely on SSE)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // SSE handles updates
    refetchInterval: false, // No polling (SSE provides real-time)
    retry: (failureCount, error) => {
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 2;
    },
    meta: {
      errorMessage: "Failed to load messages. Please try again.",
    },
  });
}

/**
 * Hook to send a message for a requested document review with optimistic updates
 */
export function useSendRequestedDocumentMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      reviewId,
      data,
    }: {
      documentId: string;
      reviewId: string;
      data: SendMessageRequest;
    }) => sendRequestedDocumentMessage(documentId, reviewId, data),

    onMutate: async ({ documentId, reviewId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["requested-document-messages", documentId, reviewId],
      });

      // Snapshot previous response
      const previousResponse =
        queryClient.getQueryData<RequestedDocumentMessagesResponse>([
          "requested-document-messages",
          documentId,
          reviewId,
        ]);

      // Get current user from localStorage or JWT (same pattern as comments)
      let currentUser = "Unknown User";
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user_data");
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.username) {
              currentUser = user.username;
            }
          } catch (error) {
            console.warn("Failed to parse user data:", error);
          }
        }
      }

      // Create optimistic message with temporary ID
      const optimisticMessage: RequestedDocumentMessage = {
        _id: `temp-${Date.now()}`,
        message: data.message,
        username: currentUser,
        added_at: new Date().toISOString(),
      };

      // Optimistically update cache - maintain response structure
      queryClient.setQueryData<RequestedDocumentMessagesResponse>(
        ["requested-document-messages", documentId, reviewId],
        (old) => {
          if (!old) {
            return {
              status: "success",
              data: [optimisticMessage],
            };
          }
          return {
            ...old,
            data: [...old.data, optimisticMessage],
          };
        },
      );

      // Return context for rollback
      return { previousResponse, optimisticMessage };
    },

    onSuccess: (responseData, variables, context) => {
      // Replace optimistic message with real server response
      // responseData is SendMessageResponse, extract responseData.data
      queryClient.setQueryData<RequestedDocumentMessagesResponse>(
        [
          "requested-document-messages",
          variables.documentId,
          variables.reviewId,
        ],
        (old) => {
          if (!old) {
            return {
              status: "success",
              data: [responseData.data],
            };
          }

          // Remove optimistic message and add real one
          const filtered = old.data.filter(
            (msg) => msg._id !== context?.optimisticMessage._id,
          );
          return {
            ...old,
            data: [...filtered, responseData.data],
          };
        },
      );

      toast.success("Message sent successfully");
    },

    onError: (error: Error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousResponse) {
        queryClient.setQueryData(
          [
            "requested-document-messages",
            variables.documentId,
            variables.reviewId,
          ],
          context.previousResponse,
        );
      }

      // Log to Sentry
      Sentry.captureException(error, {
        tags: { operation: "send_message_mutation" },
        extra: {
          documentId: variables.documentId,
          reviewId: variables.reviewId,
        },
      });

      toast.error(`Failed to send message: ${error.message}`);
    },

    onSettled: (data, error, variables) => {
      // Ensure cache consistency
      queryClient.invalidateQueries({
        queryKey: [
          "requested-document-messages",
          variables.documentId,
          variables.reviewId,
        ],
      });
    },
  });
}

/**
 * Hook to delete a message from a requested document review with optimistic updates
 */
export function useDeleteRequestedDocumentMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      reviewId,
      data,
    }: {
      documentId: string;
      reviewId: string;
      data: DeleteMessageRequest;
    }) => deleteRequestedDocumentMessage(documentId, reviewId, data),

    onMutate: async ({ documentId, reviewId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["requested-document-messages", documentId, reviewId],
      });

      // Snapshot previous response
      const previousResponse =
        queryClient.getQueryData<RequestedDocumentMessagesResponse>([
          "requested-document-messages",
          documentId,
          reviewId,
        ]);

      // Optimistically remove message - maintain response structure
      queryClient.setQueryData<RequestedDocumentMessagesResponse>(
        ["requested-document-messages", documentId, reviewId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((msg) => msg._id !== data.messageId),
          };
        },
      );

      return { previousResponse };
    },

    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousResponse) {
        queryClient.setQueryData(
          [
            "requested-document-messages",
            variables.documentId,
            variables.reviewId,
          ],
          context.previousResponse,
        );
      }

      Sentry.captureException(error, {
        tags: { operation: "delete_message_mutation" },
        extra: {
          documentId: variables.documentId,
          reviewId: variables.reviewId,
          messageId: variables.data.messageId,
        },
      });

      toast.error(`Failed to delete message: ${error.message}`);
    },

    onSuccess: () => {
      toast.success("Message deleted successfully");
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "requested-document-messages",
          variables.documentId,
          variables.reviewId,
        ],
      });
    },
  });
}

/**
 * Hook to subscribe to real-time message updates
 * Follows pattern from useDocumentComments.ts
 */
export function useRequestedDocumentMessagesRealtime(
  documentId: string,
  reviewId: string,
) {
  const queryClient = useQueryClient();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!documentId || !reviewId || isSubscribedRef.current) return;

    isSubscribedRef.current = true;
    const subscriptionKey = `${documentId}:${reviewId}`;

    const unsubscribe = realtimeManager.subscribe(
      subscriptionKey,
      (event: MessageEvent) => {
        queryClient.setQueryData<RequestedDocumentMessagesResponse>(
          ["requested-document-messages", documentId, reviewId],
          (oldResponse) => {
            if (!oldResponse) return oldResponse;

            switch (event.type) {
              case "message_added": {
                // Check for duplicates (avoid adding optimistic + SSE)
                const exists = oldResponse.data.some(
                  (msg) => msg._id === event.message._id,
                );
                if (!exists) {
                  return {
                    ...oldResponse,
                    data: [...oldResponse.data, event.message],
                  };
                }
                break;
              }
              case "message_deleted": {
                return {
                  ...oldResponse,
                  data: oldResponse.data.filter(
                    (msg) => msg._id !== event.message._id,
                  ),
                };
              }
            }

            return oldResponse;
          },
        );
      },
    );

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [documentId, reviewId, queryClient]);
}

/**
 * Hook to monitor real-time connection state
 * Copy from useDocumentComments pattern
 */
export function useRealtimeConnection() {
  const [connectionState, setConnectionState] = useState(() =>
    realtimeManager.getConnectionState(),
  );

  useEffect(() => {
    const unsubscribe = realtimeManager.onStateChange((state) => {
      setConnectionState(state);
    });

    return unsubscribe;
  }, []);

  return connectionState;
}
