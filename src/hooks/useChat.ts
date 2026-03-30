"use client";

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { chatSocket } from "@/lib/chatSocket";
import { CHAT_QUERY_KEYS } from "@/lib/config/chat";
import { PRESENCE_POLLING_INTERVAL_MS } from "@/lib/config/presence";
import {
  getConversations,
  getConversation,
  createConversation,
  updateGroup,
  updateParticipants,
  getMessages,
  sendMessage,
  sendMessageWithFiles,
  deleteMessage,
  markRead,
  clearConversation,
  leaveConversation,
  archiveConversation,
  deleteConversation,
  getStaffUsers,
  getChatClientsPage,
} from "@/lib/api/chat";
import type {
  ChatConnectionState,
  ChatMessage,
  ChatMessageEvent,
  ChatReadEvent,
  Conversation,
  ConversationListParams,
  ConversationListResponse,
  CreateConversationRequest,
  MessageListResponse,
  SendMessageRequest,
  UpdateGroupRequest,
  UpdateParticipantsRequest,
} from "@/types/chat";

export function useConversations(params?: ConversationListParams) {
  return useQuery({
    queryKey: [...CHAT_QUERY_KEYS.conversations, params],
    queryFn: () => getConversations(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTotalUnreadCount() {
  const { data } = useConversations();
  return (data?.data ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: PRESENCE_POLLING_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConversationRequest) => createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create conversation");
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      archived,
    }: {
      conversationId: string;
      archived: boolean;
    }) => archiveConversation(conversationId, { archived }),
    onSuccess: (res, { conversationId, archived }) => {
      if (res?.data) {
        queryClient.setQueryData(
          CHAT_QUERY_KEYS.conversation(conversationId),
          res,
        );
      }
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
      toast.success(
        archived ? "Conversation archived" : "Conversation unarchived",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update archive state");
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.removeQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
      toast.success("Conversation deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete conversation");
    },
  });
}

export function useUpdateGroup(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGroupRequest) => updateGroup(conversationId, data),
    onSuccess: (res) => {
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(conversationId),
        res,
      );
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
      toast.success("Group updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update group");
    },
  });
}

export function useUpdateParticipants(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateParticipantsRequest) =>
      updateParticipants(conversationId, data),
    onSuccess: (res) => {
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(conversationId),
        res,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update participants");
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      lastReadAt,
    }: {
      conversationId: string;
      lastReadAt?: string;
    }) => markRead(conversationId, lastReadAt ? { lastReadAt } : undefined),
    onSuccess: (_, { conversationId }) => {
      queryClient.setQueriesData<ConversationListResponse>(
        { queryKey: CHAT_QUERY_KEYS.conversations },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((c) =>
              c._id === conversationId ? { ...c, unreadCount: 0 } : c,
            ),
          };
        },
      );
    },
  });
}

export function useClearConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => clearConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.removeQueries({
        queryKey: CHAT_QUERY_KEYS.messages(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
      toast.success("Conversation cleared");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to clear conversation");
    },
  });
}

export function useLeaveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => leaveConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.removeQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
      });
      queryClient.removeQueries({
        queryKey: CHAT_QUERY_KEYS.messages(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to leave conversation");
    },
  });
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery<
    MessageListResponse,
    Error,
    InfiniteData<MessageListResponse>,
    readonly string[],
    string | undefined
  >({
    queryKey: CHAT_QUERY_KEYS.messages(conversationId),
    queryFn: ({ pageParam }) =>
      getMessages(conversationId, {
        before: pageParam,
        limit: 30,
      }),
    initialPageParam: undefined,
    getNextPageParam: (firstPage) => {
      if (firstPage.data.length === 30) {
        return firstPage.data[0]?._id;
      }
      return undefined;
    },
    enabled: !!conversationId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useSendMessage(
  conversationId: string,
  senderType: "staff" | "client" = "staff",
  senderId = "",
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: SendMessageRequest;
      files?: File[];
    }) => {
      if (files && files.length > 0) {
        return sendMessageWithFiles(
          conversationId,
          data.content,
          files,
          data.forwardedFromMessageId,
        );
      }
      return sendMessage(conversationId, data);
    },

    onMutate: async ({ data }) => {
      await queryClient.cancelQueries({
        queryKey: CHAT_QUERY_KEYS.messages(conversationId),
      });

      const previousMessages = queryClient.getQueryData(
        CHAT_QUERY_KEYS.messages(conversationId),
      );

      const tempMessage: ChatMessage = {
        _id: `temp-${Date.now()}`,
        conversationId,
        sender: { type: senderType, id: senderId },
        content: data.content,
        attachments: [],
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<MessageListResponse>>(
        CHAT_QUERY_KEYS.messages(conversationId),
        (old) => {
          if (!old) {
            return {
              pages: [{ status: "success" as const, data: [tempMessage] }],
              pageParams: [undefined],
            };
          }
          const pages = [...old.pages];
          const lastPage = pages[pages.length - 1];
          pages[pages.length - 1] = {
            ...lastPage,
            data: [...lastPage.data, tempMessage],
          };
          return { ...old, pages };
        },
      );

      return { previousMessages, tempId: tempMessage._id };
    },

    onSuccess: (res, _, context) => {
      queryClient.setQueryData<InfiniteData<MessageListResponse>>(
        CHAT_QUERY_KEYS.messages(conversationId),
        (old) => {
          if (!old) return old;
          const pages = old.pages.map((page) => {
            const replaced = page.data.map((m) =>
              m._id === context?.tempId ? res.data : m,
            );
            const seen = new Set<string>();
            return {
              ...page,
              data: replaced.filter((m) => {
                if (seen.has(m._id)) return false;
                seen.add(m._id);
                return true;
              }),
            };
          });
          return { ...old, pages };
        },
      );
    },

    onError: (error: Error, _, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          CHAT_QUERY_KEYS.messages(conversationId),
          context.previousMessages,
        );
      }
      toast.error(error.message || "Failed to send message");
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      deleteMessage(conversationId, messageId),

    onMutate: async (messageId) => {
      await queryClient.cancelQueries({
        queryKey: CHAT_QUERY_KEYS.messages(conversationId),
      });
      const previousMessages = queryClient.getQueryData(
        CHAT_QUERY_KEYS.messages(conversationId),
      );

      queryClient.setQueryData<InfiniteData<MessageListResponse>>(
        CHAT_QUERY_KEYS.messages(conversationId),
        (old) => {
          if (!old) return old;
          const pages = old.pages.map((page) => ({
            ...page,
            data: page.data.filter((m) => m._id !== messageId),
          }));
          return { ...old, pages };
        },
      );

      return { previousMessages };
    },

    onError: (error: Error, _, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          CHAT_QUERY_KEYS.messages(conversationId),
          context.previousMessages,
        );
      }
      toast.error(error.message || "Failed to delete message");
    },
  });
}

export function useForwardMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetConversationId,
      forwardedFromMessageId,
      content,
    }: {
      targetConversationId: string;
      forwardedFromMessageId: string;
      content?: string;
    }) =>
      sendMessage(targetConversationId, { content, forwardedFromMessageId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.messages(res.data.conversationId),
      });
      toast.success("Message forwarded");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to forward message");
    },
  });
}


export function useStaffUsers() {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.staffUsers,
    queryFn: getStaffUsers,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useChatClients(p0: { permissionMode?: string; currentUsername?: string; }) {
  const clientsQuery = useInfiniteQuery({
    queryKey: CHAT_QUERY_KEYS.clientUsers,
    queryFn: ({ pageParam }: { pageParam: number }) => getChatClientsPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.clients.length === 20 ? allPages.length + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const allLoaded = useMemo(
    () => clientsQuery.data?.pages.flatMap((p) => p.clients) ?? [],
    [clientsQuery.data],
  );

  return {
    data: { data: allLoaded },
    total: clientsQuery.data?.pages[0]?.total ?? allLoaded.length,
    fetchNextPage: clientsQuery.fetchNextPage,
    hasNextPage: clientsQuery.hasNextPage ?? false,
    isFetchingNextPage: clientsQuery.isFetchingNextPage,
    isLoading: clientsQuery.isLoading,
  };
}


export function useChatSocket(selectedConversationId?: string | null) {
  const queryClient = useQueryClient();
  const selectedIdRef = useRef(selectedConversationId);

  useEffect(() => {
    selectedIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    chatSocket.connect();

    const unsubMessage = chatSocket.onChatMessage(
      (event: ChatMessageEvent) => {
        const { conversationId, message } = event;

        queryClient.setQueryData<InfiniteData<MessageListResponse>>(
          CHAT_QUERY_KEYS.messages(conversationId),
          (old) => {
            if (!old) return old;
            const lastPage = old.pages[old.pages.length - 1];
            if (lastPage.data.some((m) => m._id === message._id)) return old;
            const pages = [...old.pages];
            pages[pages.length - 1] = {
              ...lastPage,
              data: [...lastPage.data, message],
            };
            return { ...old, pages };
          },
        );

        queryClient.setQueriesData<ConversationListResponse>(
          { queryKey: CHAT_QUERY_KEYS.conversations },
          (old) => {
            if (!old) return old;
            const isSelected = selectedIdRef.current === conversationId;
            return {
              ...old,
              data: old.data.map((c) =>
                c._id === conversationId
                  ? {
                      ...c,
                      lastMessage: {
                        content: message.content,
                        sender: message.sender,
                        createdAt: message.createdAt,
                      },
                      unreadCount: isSelected ? 0 : c.unreadCount + 1,
                    }
                  : c,
              ),
            };
          },
        );
      },
    );

    const unsubRead = chatSocket.onChatRead((event: ChatReadEvent) => {
      const { conversationId, participant, lastReadAt } = event;
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(conversationId),
        (old: { data: Conversation } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              members: old.data.members?.map((m) =>
                m.type === participant.type && m.id === participant.id
                  ? { ...m, lastReadAt }
                  : m,
              ),
            },
          };
        },
      );
    });

    return () => {
      unsubMessage();
      unsubRead();
      chatSocket.disconnect();
    };
  }, [queryClient]);
}

export function useChatConnectionState(): ChatConnectionState {
  const [state, setState] = useState<ChatConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null,
  });

  useEffect(() => {
    const unsub = chatSocket.onConnectionStateChange(setState);
    return unsub;
  }, []);

  return state;
}
