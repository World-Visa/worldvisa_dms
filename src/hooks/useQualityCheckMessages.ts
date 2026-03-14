import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { realtimeManager, type RequestedDocumentEvent } from "@/lib/realtime";
import type { MessageEvent, CommentEvent } from "@/types/comments";
import {
  getQualityCheckMessages,
  addQualityCheckMessage,
  editQualityCheckMessage,
  deleteQualityCheckMessage,
  type QualityCheckMessage,
  type QualityCheckMessagesResponse,
} from "@/lib/api/qualityCheckMessages";

const QC_MESSAGES_KEY = "quality-check-messages";

export function useQualityCheckMessages(qcId: string) {
  return useQuery({
    queryKey: [QC_MESSAGES_KEY, qcId],
    queryFn: () => getQualityCheckMessages(qcId),
    enabled: !!qcId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: (failureCount, error) => {
      if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useAddQualityCheckMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      qcId,
      data,
    }: {
      qcId: string;
      data: { message: string };
    }) => addQualityCheckMessage(qcId, data),

    onMutate: async ({ qcId, data }) => {
      await queryClient.cancelQueries({
        queryKey: [QC_MESSAGES_KEY, qcId],
      });

      const previousResponse =
        queryClient.getQueryData<QualityCheckMessagesResponse>([
          QC_MESSAGES_KEY,
          qcId,
        ]);

      let currentUser = "Unknown User";
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user_data");
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.username) currentUser = user.username;
          } catch {
            // ignore
          }
        }
      }

      const optimisticMessage: QualityCheckMessage = {
        _id: `temp-${Date.now()}`,
        message: data.message,
        username: currentUser,
        added_at: new Date().toISOString(),
      };

      queryClient.setQueryData<QualityCheckMessagesResponse>(
        [QC_MESSAGES_KEY, qcId],
        (old) => {
          if (!old) return { success: true, data: [optimisticMessage] };
          return { ...old, data: [...old.data, optimisticMessage] };
        },
      );

      return { previousResponse, optimisticMessage };
    },

    onSuccess: (responseData, variables, context) => {
      queryClient.setQueryData<QualityCheckMessagesResponse>(
        [QC_MESSAGES_KEY, variables.qcId],
        (old) => {
          if (!old) return { success: true, data: [responseData.data] };
          const filtered = old.data.filter(
            (msg) => msg._id !== context?.optimisticMessage._id,
          );
          return { ...old, data: [...filtered, responseData.data] };
        },
      );
    },

    onError: (error: Error, variables, context) => {
      if (context?.previousResponse) {
        queryClient.setQueryData(
          [QC_MESSAGES_KEY, variables.qcId],
          context.previousResponse,
        );
      }
      Sentry.captureException(error, {
        tags: { operation: "add_qc_message" },
        extra: { qcId: variables.qcId },
      });
      toast.error(`Failed to send message: ${error.message}`);
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QC_MESSAGES_KEY, variables.qcId],
      });
    },
  });
}

export function useEditQualityCheckMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      qcId,
      data,
    }: {
      qcId: string;
      data: { messageId: string; message: string };
    }) => editQualityCheckMessage(qcId, data),

    onMutate: async ({ qcId, data }) => {
      await queryClient.cancelQueries({ queryKey: [QC_MESSAGES_KEY, qcId] });

      const previousResponse =
        queryClient.getQueryData<QualityCheckMessagesResponse>([
          QC_MESSAGES_KEY,
          qcId,
        ]);

      queryClient.setQueryData<QualityCheckMessagesResponse>(
        [QC_MESSAGES_KEY, qcId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((msg) =>
              msg._id === data.messageId
                ? { ...msg, message: data.message }
                : msg,
            ),
          };
        },
      );

      return { previousResponse };
    },

    onSuccess: (responseData, variables) => {
      queryClient.setQueryData<QualityCheckMessagesResponse>(
        [QC_MESSAGES_KEY, variables.qcId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((msg) =>
              msg._id === responseData.data._id ? responseData.data : msg,
            ),
          };
        },
      );
    },

    onError: (error: Error, variables, context) => {
      if (context?.previousResponse) {
        queryClient.setQueryData(
          [QC_MESSAGES_KEY, variables.qcId],
          context.previousResponse,
        );
      }
      toast.error(`Failed to edit message: ${error.message}`);
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QC_MESSAGES_KEY, variables.qcId],
      });
    },
  });
}

export function useDeleteQualityCheckMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      qcId,
      data,
    }: {
      qcId: string;
      data: { messageId: string };
    }) => deleteQualityCheckMessage(qcId, data),

    onMutate: async ({ qcId, data }) => {
      await queryClient.cancelQueries({ queryKey: [QC_MESSAGES_KEY, qcId] });

      const previousResponse =
        queryClient.getQueryData<QualityCheckMessagesResponse>([
          QC_MESSAGES_KEY,
          qcId,
        ]);

      queryClient.setQueryData<QualityCheckMessagesResponse>(
        [QC_MESSAGES_KEY, qcId],
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

    onSuccess: () => {
      toast.success("Message deleted");
    },

    onError: (error: Error, variables, context) => {
      if (context?.previousResponse) {
        queryClient.setQueryData(
          [QC_MESSAGES_KEY, variables.qcId],
          context.previousResponse,
        );
      }
      Sentry.captureException(error, {
        tags: { operation: "delete_qc_message" },
        extra: { qcId: variables.qcId },
      });
      toast.error(`Failed to delete message: ${error.message}`);
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QC_MESSAGES_KEY, variables.qcId],
      });
    },
  });
}

export function useQualityCheckMessagesRealtime(qcId: string) {
  const queryClient = useQueryClient();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!qcId || isSubscribedRef.current) return;

    isSubscribedRef.current = true;

    const unsubscribe = realtimeManager.subscribe(
      qcId,
      (event: CommentEvent | RequestedDocumentEvent | MessageEvent) => {
        if (event.type !== "message_added" && event.type !== "message_deleted") return;
        queryClient.setQueryData<QualityCheckMessagesResponse>(
          [QC_MESSAGES_KEY, qcId],
          (oldResponse) => {
            if (!oldResponse) return oldResponse;

            switch (event.type) {
              case "message_added": {
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
  }, [qcId, queryClient]);
}

export function useQCRealtimeConnection() {
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
