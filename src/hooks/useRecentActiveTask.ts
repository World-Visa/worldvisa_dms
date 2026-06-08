"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getClientTasks,
  getTasks,
  mapApiTaskToApplicationTask,
} from "@/lib/api/tasks";
import { pickNearestActiveTask } from "@/lib/constants/tasks";
import { TASK_KEYS } from "@/hooks/useApplicationTasks";
import type { ApplicationTask } from "@/types/tasks";

const ADMIN_LIMIT = 25;
const CLIENT_LIMIT = 50;

const QUERY_OPTIONS = {
  staleTime: 30_000,
  gcTime: 5 * 60 * 1000,
  retry: 2,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30_000),
  refetchOnWindowFocus: false,
} as const;

interface UseRecentActiveTaskOptions {
  leadId: string;
  isClientView?: boolean;
  enabled?: boolean;
}

export function useRecentActiveTask({
  leadId,
  isClientView = false,
  enabled = true,
}: UseRecentActiveTaskOptions) {
  const adminQuery = useQuery({
    queryKey: TASK_KEYS.list({
      leadId,
      limit: ADMIN_LIMIT,
      sortBy: "date",
      sortOrder: "asc",
    }),
    queryFn: () =>
      getTasks({
        leadId,
        page: 1,
        limit: ADMIN_LIMIT,
        sortBy: "date",
        sortOrder: "asc",
      }),
    select: (data): ApplicationTask | null => {
      const tasks = data.data.tasks.map(mapApiTaskToApplicationTask);
      return pickNearestActiveTask(tasks);
    },
    enabled: enabled && Boolean(leadId) && !isClientView,
    ...QUERY_OPTIONS,
  });

  const clientQuery = useQuery({
    queryKey: TASK_KEYS.clientList({
      limit: CLIENT_LIMIT,
      sortBy: "date",
      sortOrder: "asc",
    }),
    queryFn: () =>
      getClientTasks({
        page: 1,
        limit: CLIENT_LIMIT,
        sortBy: "date",
        sortOrder: "asc",
      }),
    select: (data): ApplicationTask | null => {
      const tasks = data.data.tasks
        .map(mapApiTaskToApplicationTask)
        .filter((t) => t.applicationId === leadId);
      return pickNearestActiveTask(tasks);
    },
    enabled: enabled && Boolean(leadId) && isClientView,
    ...QUERY_OPTIONS,
  });

  const query = isClientView ? clientQuery : adminQuery;

  return {
    task: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
