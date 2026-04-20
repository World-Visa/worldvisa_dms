"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getEmailList,
  getEmailThread,
  getSingleEmail,
  sendEmail,
  markEmailRead,
} from "@/lib/api/email";
import type { SendEmailPayload } from "@/types/email";

export const EMAIL_KEYS = {
  list: (
    direction?: string,
    q?: string,
    filter?: string,
    page?: number,
    limit?: number
  ) =>
    [
      "email",
      "list",
      direction ?? "all",
      q ?? "",
      filter ?? "",
      page ?? 1,
      limit ?? 10,
    ] as const,
  thread: (threadId: string) => ["email", "thread", threadId] as const,
  message: (id: string) => ["email", "message", id] as const,
} as const;

export function useEmailList(params: {
  direction?: "inbound" | "outbound";
  filter?: string;
  q?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: EMAIL_KEYS.list(
      params.direction,
      params.q,
      params.filter,
      params.page,
      params.limit
    ),
    queryFn: () => getEmailList(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useInfiniteEmailList(params: {
  direction?: "inbound" | "outbound";
  filter?: string;
  q?: string;
  limit?: number;
} = {}) {
  return useInfiniteQuery({
    queryKey: ["email", "list", "infinite", params.direction ?? "all", params.q ?? "", params.filter ?? ""],
    queryFn: ({ pageParam }) => getEmailList({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useEmailThread(threadId: string, enabled = true) {
  return useQuery({
    queryKey: EMAIL_KEYS.thread(threadId),
    queryFn: () => getEmailThread(threadId),
    enabled: enabled && !!threadId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSingleEmail(id: string, enabled = true) {
  return useQuery({
    queryKey: EMAIL_KEYS.message(id),
    queryFn: () => getSingleEmail(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useMarkEmailRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markEmailRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "list"] });
      // Optimistically decrement — callers only invoke markRead when email is unread
      queryClient.setQueryData<number>(
        ["email", "unread-count"],
        (old) => (old != null && old > 0 ? old - 1 : old)
      );
    },
  });
}

export function useEmailUnreadCount() {
  return useQuery({
    queryKey: ["email", "unread-count"],
    queryFn: async () => {
      const res = await getEmailList({ direction: "inbound", page: 1, limit: 1 });
      return res.unreadTotal ?? 0;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendEmailPayload) => sendEmail(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMAIL_KEYS.list("outbound") });
      queryClient.invalidateQueries({ queryKey: EMAIL_KEYS.list() });
      if (variables.in_reply_to) {
        // We don't know the thread_id here, but caller can invalidate manually
        queryClient.invalidateQueries({ queryKey: ["email", "thread"] });
      }
      toast.success("Email sent");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send email");
    },
  });
}
