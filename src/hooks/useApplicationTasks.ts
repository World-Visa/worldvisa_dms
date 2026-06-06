"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTask,
  deleteTask,
  getAllTasks,
  getClientTasks,
  getTasks,
  mapApiTaskToApplicationTask,
  mapFormDataToCreatePayload,
  mapFormDataToUpdatePayload,
  updateTask,
  updateTaskStatus,
} from "@/lib/api/tasks";
import { revalidateTasksCache } from "@/lib/actions/cache-actions";
import type {
  ApplicationTask,
  GetAllTasksParams,
  GetClientTasksParams,
  GetTasksParams,
  GetTasksResponse,
  TaskFormData,
  TaskStatus,
} from "@/types/tasks";

export const TASK_KEYS = {
  all: () => ["getTasks"] as const,
  lists: () => [...TASK_KEYS.all(), "list"] as const,
  list: (filters: Omit<GetTasksParams, "page">) =>
    [...TASK_KEYS.lists(), filters] as const,
  allTasksLists: () => [...TASK_KEYS.all(), "all-list"] as const,
  allTasksList: (filters: Omit<GetAllTasksParams, "page">) =>
    [...TASK_KEYS.allTasksLists(), filters] as const,
  clientLists: () => [...TASK_KEYS.all(), "client-list"] as const,
  clientList: (filters: Omit<GetClientTasksParams, "page">) =>
    [...TASK_KEYS.clientLists(), filters] as const,
} as const;

type InfiniteTaskFilters = Omit<GetTasksParams, "page">;
type InfiniteAllTaskFilters = Omit<GetAllTasksParams, "page">;
type InfiniteClientTaskFilters = Omit<GetClientTasksParams, "page">;

const INFINITE_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
  retry: 2,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30_000),
  refetchOnWindowFocus: false,
} as const;

function flattenTasks(data: { pages: GetTasksResponse[] } | undefined): ApplicationTask[] {
  return (
    data?.pages.flatMap((page) =>
      page.data.tasks.map(mapApiTaskToApplicationTask),
    ) ?? []
  );
}

function getNextPageFromResponse(lastPage: GetTasksResponse): number | undefined {
  const { page, pages } = lastPage.pagination;
  return page < pages ? page + 1 : undefined;
}

async function invalidateTaskQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  leadId?: string,
) {
  await queryClient.invalidateQueries({
    queryKey: TASK_KEYS.all(),
    exact: false,
    refetchType: "active",
  });
  if (leadId) {
    await revalidateTasksCache(leadId);
  }
}

export function useInfiniteApplicationTasks(
  filters: InfiniteTaskFilters,
  options?: { enabled?: boolean },
) {
  const limit = filters.limit ?? 20;

  const query = useInfiniteQuery<GetTasksResponse>({
    queryKey: TASK_KEYS.list({ ...filters, limit }),
    queryFn: ({ pageParam }) =>
      getTasks({
        ...filters,
        limit,
        page: typeof pageParam === "number" ? pageParam : 1,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextPageFromResponse,
    enabled: (options?.enabled ?? true) && Boolean(filters.leadId),
    ...INFINITE_QUERY_OPTIONS,
  });

  return { ...query, tasks: flattenTasks(query.data) };
}

export function useInfiniteAllTasks(
  filters: InfiniteAllTaskFilters,
  options?: { enabled?: boolean },
) {
  const limit = filters.limit ?? 50;

  const query = useInfiniteQuery<GetTasksResponse>({
    queryKey: TASK_KEYS.allTasksList({ ...filters, limit }),
    queryFn: ({ pageParam }) =>
      getAllTasks({
        ...filters,
        limit,
        page: typeof pageParam === "number" ? pageParam : 1,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextPageFromResponse,
    enabled: options?.enabled ?? true,
    ...INFINITE_QUERY_OPTIONS,
  });

  return { ...query, tasks: flattenTasks(query.data) };
}

export function useInfiniteClientTasks(
  filters: InfiniteClientTaskFilters,
  options?: { enabled?: boolean },
) {
  const limit = filters.limit ?? 20;

  const query = useInfiniteQuery<GetTasksResponse>({
    queryKey: TASK_KEYS.clientList({ ...filters, limit }),
    queryFn: ({ pageParam }) =>
      getClientTasks({
        ...filters,
        limit,
        page: typeof pageParam === "number" ? pageParam : 1,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextPageFromResponse,
    enabled: options?.enabled ?? true,
    ...INFINITE_QUERY_OPTIONS,
  });

  return { ...query, tasks: flattenTasks(query.data) };
}

export function useCreateTask(leadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskFormData) =>
      createTask(mapFormDataToCreatePayload(leadId, data)),
    onSettled: async () => {
      await invalidateTaskQueries(queryClient, leadId);
    },
  });
}

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: TaskStatus;
      leadId?: string;
    }) => updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: TASK_KEYS.allTasksLists() });

      const previous = queryClient.getQueriesData<{ pages: GetTasksResponse[] }>({
        queryKey: TASK_KEYS.allTasksLists(),
      });

      queryClient.setQueriesData<{ pages: GetTasksResponse[] }>(
        { queryKey: TASK_KEYS.allTasksLists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                tasks: page.data.tasks.map((t) =>
                  t._id === taskId ? { ...t, status } : t,
                ),
              },
            })),
          };
        },
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: async (_data, _err, variables) => {
      await invalidateTaskQueries(queryClient, variables?.leadId);
    },
  });
}

export function useBoardUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
      previousStatus,
    }: {
      taskId: string;
      data: TaskFormData;
      previousStatus: TaskStatus;
      leadId: string;
    }) => {
      await updateTask(taskId, mapFormDataToUpdatePayload(data));
      if (data.status && data.status !== previousStatus) {
        await updateTaskStatus(taskId, data.status);
      }
    },
    onSettled: async (_data, _err, { leadId }) => {
      await invalidateTaskQueries(queryClient, leadId);
    },
  });
}

export function useBoardDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: { taskId: string; leadId: string }) =>
      deleteTask(taskId),
    onSettled: async (_data, _err, { leadId }) => {
      await invalidateTaskQueries(queryClient, leadId);
    },
  });
}

export function useUpdateTask(leadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
      previousStatus,
    }: {
      taskId: string;
      data: TaskFormData;
      previousStatus: TaskStatus;
    }) => {
      await updateTask(taskId, mapFormDataToUpdatePayload(data));
      if (data.status && data.status !== previousStatus) {
        await updateTaskStatus(taskId, data.status);
      }
    },
    onSettled: async () => {
      await invalidateTaskQueries(queryClient, leadId);
    },
  });
}

export function useDeleteTask(leadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSettled: async () => {
      await invalidateTaskQueries(queryClient, leadId);
    },
  });
}

export function useInvalidateTasks() {
  const queryClient = useQueryClient();

  return (options?: { leadId?: string; client?: boolean }) => {
    if (options?.client) {
      return queryClient.invalidateQueries({
        queryKey: TASK_KEYS.clientLists(),
        exact: false,
        refetchType: "active",
      });
    }
    return queryClient.invalidateQueries({
      queryKey: options?.leadId ? TASK_KEYS.lists() : TASK_KEYS.all(),
      exact: false,
      refetchType: "active",
    });
  };
}
