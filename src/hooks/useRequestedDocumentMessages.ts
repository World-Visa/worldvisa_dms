import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  getRequestedDocumentMessages,
  sendRequestedDocumentMessage,
  deleteRequestedDocumentMessage,
  SendMessageRequest,
  DeleteMessageRequest,
  RequestedDocumentMessage,
  RequestedDocumentMessagesResponse,
} from "@/lib/api/requestedDocumentMessages";
import * as Sentry from "@sentry/nextjs";
import { showErrorToast, showSuccessToast } from "@/components/ui/primitives/sonner-helpers";
import { realtimeManager } from "@/lib/realtime";
import { MessageEvent } from "@/types/comments";
import { useAuth } from "@/hooks/useAuth";
import type { RequestedDocument } from "@/lib/api/requestedDocuments";

const REQUESTED_DOCUMENT_MESSAGES_KEYS = {
  all: ["requested-document-messages"] as const,
  byReview: (documentId: string, reviewId: string) =>
    ["requested-document-messages", documentId, reviewId] as const,
};

function isMessageEvent(event: unknown): event is MessageEvent {
  if (!event || typeof event !== "object") return false;
  const e = event as { type?: unknown; message?: unknown; review_id?: unknown };
  return (
    typeof e.type === "string" &&
    e.type.startsWith("message_") &&
    typeof e.review_id === "string" &&
    typeof e.message === "object" &&
    e.message !== null
  );
}

function syncRequestedDocMessageToLists(
  queryClient: ReturnType<typeof useQueryClient>,
  documentId: string,
  reviewId: string,
  message: RequestedDocumentMessage,
) {
  const listQueryPrefixes: Array<readonly unknown[]> = [
    ["requested-documents-to-me"],
    ["my-requested-documents"],
    ["all-requested-documents"],
    ["all-requested-documents-paginated"],
    ["requested-documents-search"],
  ];

  const appendUnique = (
    list: RequestedDocument["requested_review"]["messages"] | undefined,
  ) => {
    const prev = Array.isArray(list) ? list : [];
    if (prev.some((m) => m._id === message._id)) return prev;
    return [
      ...prev,
      {
        _id: message._id,
        username: message.username,
        message: message.message,
        added_at: message.added_at,
      },
    ];
  };

  const updateDoc = (doc: RequestedDocument): RequestedDocument => {
    if (doc._id !== documentId) return doc;

    const nextRequestedReview =
      doc.requested_review?._id === reviewId
        ? {
            ...doc.requested_review,
            messages: appendUnique(doc.requested_review.messages),
          }
        : doc.requested_review;

    const nextRequestedReviews = doc.requested_reviews
      ? doc.requested_reviews.map((r) =>
          r._id === reviewId ? { ...r, messages: appendUnique(r.messages) } : r,
        )
      : doc.requested_reviews;

    return {
      ...doc,
      requested_review: nextRequestedReview,
      requested_reviews: nextRequestedReviews,
    };
  };

  queryClient.setQueryData<RequestedDocument>(
    ["requested-document", documentId],
    (old) => (old ? updateDoc(old) : old),
  );

  listQueryPrefixes.forEach((queryKey) => {
    queryClient.setQueriesData(
      { queryKey, exact: false },
      (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        if (!("data" in old)) return old;

        const oldAny = old as { data?: unknown };
        if (!Array.isArray(oldAny.data)) return old;

        const nextData = (oldAny.data as RequestedDocument[]).map(updateDoc);
        return { ...(old as object), data: nextData };
      },
    );
  });
}

function removeRequestedDocMessageFromLists(
  queryClient: ReturnType<typeof useQueryClient>,
  documentId: string,
  reviewId: string,
  messageId: string,
) {
  const listQueryPrefixes: Array<readonly unknown[]> = [
    ["requested-documents-to-me"],
    ["my-requested-documents"],
    ["all-requested-documents"],
    ["all-requested-documents-paginated"],
    ["requested-documents-search"],
  ];

  const removeById = (
    list: RequestedDocument["requested_review"]["messages"] | undefined,
  ) => {
    const prev = Array.isArray(list) ? list : [];
    if (!prev.some((m) => m._id === messageId)) return prev;
    return prev.filter((m) => m._id !== messageId);
  };

  const updateDoc = (doc: RequestedDocument): RequestedDocument => {
    if (doc._id !== documentId) return doc;

    const nextRequestedReview =
      doc.requested_review?._id === reviewId
        ? {
            ...doc.requested_review,
            messages: removeById(doc.requested_review.messages),
          }
        : doc.requested_review;

    const nextRequestedReviews = doc.requested_reviews
      ? doc.requested_reviews.map((r) =>
          r._id === reviewId ? { ...r, messages: removeById(r.messages) } : r,
        )
      : doc.requested_reviews;

    return {
      ...doc,
      requested_review: nextRequestedReview,
      requested_reviews: nextRequestedReviews,
    };
  };

  queryClient.setQueryData<RequestedDocument>(
    ["requested-document", documentId],
    (old) => (old ? updateDoc(old) : old),
  );

  listQueryPrefixes.forEach((queryKey) => {
    queryClient.setQueriesData(
      { queryKey, exact: false },
      (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        if (!("data" in old)) return old;

        const oldAny = old as { data?: unknown };
        if (!Array.isArray(oldAny.data)) return old;

        const nextData = (oldAny.data as RequestedDocument[]).map(updateDoc);
        return { ...(old as object), data: nextData };
      },
    );
  });
}


export function useRequestedDocumentMessages(
  documentId: string,
  reviewId: string,
) {
  return useQuery({
    queryKey: REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(documentId, reviewId),
    queryFn: () => getRequestedDocumentMessages(documentId, reviewId),
    enabled: !!documentId && !!reviewId,
    // SSE updates the cache, so avoid unnecessary refetching.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // SSE handles updates
    refetchInterval: false, // No polling (SSE provides real-time)
    refetchOnReconnect: false,
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
  const { user } = useAuth();

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
        queryKey: REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(documentId, reviewId),
      });

      // Snapshot previous response
      const previousResponse =
        queryClient.getQueryData<RequestedDocumentMessagesResponse>(
          REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(documentId, reviewId),
        );

      const currentUsername = user?.username ?? "Unknown User";
      const nowIso = new Date().toISOString();

      const optimisticMessage: RequestedDocumentMessage = {
        _id: `temp-${Date.now()}`,
        message: data.message,
        username: currentUsername,
        added_at: nowIso,
        profile_image_url: null,
      };

      queryClient.setQueryData<RequestedDocumentMessagesResponse>(
        REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(documentId, reviewId),
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

      return { previousResponse, optimisticMessage };
    },

    onSuccess: (responseData, variables, context) => {
      queryClient.setQueryData<RequestedDocumentMessagesResponse>(
        REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(
          variables.documentId,
          variables.reviewId,

        ),
        () => ({
          status: responseData.status,
          data: responseData.data,
          message: responseData.message,
        }),
      );

      const latest = responseData.data.at(-1);
      if (latest) {
        syncRequestedDocMessageToLists(
          queryClient,
          variables.documentId,
          variables.reviewId,
          latest,
        );
      }

      showSuccessToast("Message sent successfully");
    },

    onError: (error: Error, variables, context) => {
      if (context?.previousResponse) {
        queryClient.setQueryData(
          REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(
            variables.documentId,
            variables.reviewId,
          ),
          context.previousResponse,
        );
      }

      Sentry.captureException(error, {
        tags: { operation: "send_message_mutation" },
        extra: {
          documentId: variables.documentId,
          reviewId: variables.reviewId,
        },
      });

      showErrorToast(`Failed to send message`, error.message);
    },

    onSettled: (data, error, variables) => {
      // Cache is updated optimistically + onSuccess; SSE provides canonical updates.
    },
  });
}

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
      await queryClient.cancelQueries({
        queryKey: REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(documentId, reviewId),
      });

      const previousResponse =
        queryClient.getQueryData<RequestedDocumentMessagesResponse>([
          ...REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(documentId, reviewId),
        ]);

      const previousDoc = queryClient.getQueryData<RequestedDocument>([
        "requested-document",
        documentId,
      ]);

      // Optimistically update the requested-doc lists so the table count updates immediately
      removeRequestedDocMessageFromLists(
        queryClient,
        documentId,
        reviewId,
        data.messageId,
      );

      queryClient.setQueryData<RequestedDocumentMessagesResponse>(
        REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(documentId, reviewId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((msg) => msg._id !== data.messageId),
          };
        },
      );

      return { previousResponse, previousDoc, documentId };
    },

    onError: (error: Error, variables, context) => {
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
      if (context?.previousDoc) {
        queryClient.setQueryData(
          ["requested-document", context.documentId],
          context.previousDoc,
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

      showErrorToast(`Failed to delete message`, error.message);
    },

    onSuccess: () => {
      showSuccessToast("Message deleted successfully");
    },

    onSettled: (data, error, variables) => {
    },
  });
}


export function useRequestedDocumentMessagesRealtime(
  documentId: string,
  reviewId: string,
) {
  const queryClient = useQueryClient();
  const isSubscribedRef = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!documentId || !reviewId || isSubscribedRef.current) return;

    isSubscribedRef.current = true;
    const subscriptionKey = `${documentId}:${reviewId}`;

    const unsubscribe = realtimeManager.subscribe(
      subscriptionKey,
      (event) => {
        queryClient.setQueryData<RequestedDocumentMessagesResponse>(
          REQUESTED_DOCUMENT_MESSAGES_KEYS.byReview(documentId, reviewId),
          (oldResponse) => {
            if (!oldResponse) return oldResponse;
            if (!isMessageEvent(event)) return oldResponse;

            switch (event.type) {
              case "message_added": {
                syncRequestedDocMessageToLists(
                  queryClient,
                  documentId,
                  reviewId,
                  event.message,
                );

                const exists = oldResponse.data.some(
                  (msg) => msg._id === event.message._id,
                );
                if (!exists) {
                  const isOwnMessage =
                    Boolean(user?.username) &&
                    event.message.username === user?.username;
                  if (isOwnMessage) {
                    const optimisticIdx = oldResponse.data.findIndex((msg) => {
                      if (!msg._id?.startsWith("temp-")) return false;
                      if (msg.username !== event.message.username) return false;
                      if (msg.message !== event.message.message) return false;
                      const optimisticTime = Date.parse(msg.added_at);
                      const realTime = Date.parse(event.message.added_at);
                      if (Number.isNaN(optimisticTime) || Number.isNaN(realTime))
                        return false;
                      return Math.abs(realTime - optimisticTime) <= 15_000;
                    });

                    if (optimisticIdx !== -1) {
                      const next = [...oldResponse.data];
                      next[optimisticIdx] = event.message;
                      return { ...oldResponse, data: next };
                    }
                  }

                  return {
                    ...oldResponse,
                    data: [...oldResponse.data, event.message],
                  };
                }
                break;
              }
              case "message_deleted": {
                removeRequestedDocMessageFromLists(
                  queryClient,
                  documentId,
                  reviewId,
                  event.message._id,
                );

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
  }, [documentId, reviewId, queryClient, user?.username]);
}

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
