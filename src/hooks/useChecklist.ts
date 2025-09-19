/**
 * Checklist React Query Hooks
 *
 * This module provides React Query hooks for managing checklist data
 * with optimistic updates, error handling, and proper cache management.
 */

import {
  createChecklistItem,
  deleteChecklist,
  deleteChecklistItem,
  getChecklist,
  saveChecklist,
  updateChecklist,
  updateChecklistItem,
  updateDescription,
} from "@/lib/api/checklist";
import type {
  ChecklistCreateRequest,
  ChecklistDeleteRequest,
  ChecklistItem,
  ChecklistResponse,
  ChecklistUpdateRequest,
} from "@/types/checklist";
import { AddDescriptionRequest } from "@/types/description";
import * as Sentry from "@sentry/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to fetch checklist data for an application
 */
export function useChecklist(applicationId: string) {
  return useQuery({
    queryKey: ["checklist", applicationId],
    queryFn: async () => {
      try {
        const result = await getChecklist(applicationId);

        // Ensure the response has the expected structure
        if (result && typeof result === "object" && "data" in result) {
          // Ensure data is an array
          if (!Array.isArray(result.data)) {
            console.warn(
              "useChecklist: API returned non-array data",
              result.data
            );
            return { ...result, data: [] };
          }
          return result;
        }
        console.warn("useChecklist: API returned unexpected structure", result);
        return { success: true, data: [] };
      } catch (error) {
        console.error("useChecklist: API call failed", error);

        // Handle authentication errors gracefully
        if (
          error instanceof Error &&
          (error.message.includes("User not found") ||
            error.message.includes("401") ||
            error.message.includes("Unauthorized") ||
            error.message.includes("Token expired"))
        ) {
          console.warn(
            "useChecklist: Authentication error, returning empty checklist"
          );
          return { success: true, data: [] };
        }

        throw error;
      }
    },
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for checklist mutations (create, update, delete)
 */
export function useChecklistMutations(applicationId: string) {
  const queryClient = useQueryClient();

  const createItem = useMutation({
    mutationFn: (item: ChecklistCreateRequest) =>
      createChecklistItem(applicationId, item),
    onSuccess: () => {
      // Invalidate and refetch checklist
      queryClient.invalidateQueries({
        queryKey: ["checklist", applicationId],
      });

      // Also invalidate application documents to refresh counts
      queryClient.invalidateQueries({
        queryKey: ["application-documents", applicationId],
      });

      toast.success("Checklist item added successfully");
    },
    onError: (error: Error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "create_checklist_item",
          applicationId,
        },
      });
      toast.error(`Failed to add checklist item: ${error.message}`);
    },
  });

  const updateItem = useMutation({
    mutationFn: (item: ChecklistUpdateRequest) =>
      updateChecklistItem(applicationId, item),
    onSuccess: (data) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["checklist", applicationId],
        (old: ChecklistResponse) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.map((item: ChecklistItem) =>
              item.checklist_id === data.data.checklist_id
                ? { ...item, ...data.data }
                : item
            ),
          };
        }
      );

      toast.success("Checklist item updated successfully");
    },
    onError: (error: Error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "update_checklist_item",
          applicationId,
        },
      });
      toast.error(`Failed to update checklist item: ${error.message}`);
    },
  });

  const updateItemDescription = useMutation({
    mutationFn: (item: AddDescriptionRequest) =>
      updateDescription(applicationId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checklist", applicationId],
      });
      toast.success("Description updated successfully");
    },
    onError: (error: Error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "update_checklist_item",
          applicationId,
        },
      });
      toast.error(`Failed to update checklist description: ${error.message}`);
    },
  });

  const deleteItem = useMutation({
    mutationFn: (request: ChecklistDeleteRequest) =>
      deleteChecklistItem(applicationId, request),
    onSuccess: (data, variables) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["checklist", applicationId],
        (old: ChecklistResponse) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.filter(
              (item: ChecklistItem) =>
                item.checklist_id !== variables.checklist_id
            ),
          };
        }
      );

      toast.success("Checklist item deleted successfully");
    },
    onError: (error: Error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "delete_checklist_item",
          applicationId,
        },
      });
      toast.error(`Failed to delete checklist item: ${error.message}`);
    },
  });

  const batchSave = useMutation({
    mutationFn: (items: ChecklistCreateRequest[]) =>
      saveChecklist(applicationId, items),
    onSuccess: (data) => {
      // Invalidate and refetch checklist
      queryClient.invalidateQueries({
        queryKey: ["checklist", applicationId],
      });

      // Also invalidate application documents to refresh counts
      queryClient.invalidateQueries({
        queryKey: ["application-documents", applicationId],
      });

      toast.success(`Checklist saved successfully (${data.data.length} items)`);
    },
    onError: (error: Error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "batch_save_checklist",
          applicationId,
        },
      });
      toast.error(`Failed to save checklist: ${error.message}`);
    },
  });

  const batchUpdate = useMutation({
    mutationFn: (items: ChecklistUpdateRequest[]) =>
      updateChecklist(applicationId, items),
    onSuccess: (data) => {
      // Invalidate and refetch checklist
      queryClient.invalidateQueries({
        queryKey: ["checklist", applicationId],
      });

      toast.success(
        `Checklist updated successfully (${data.data.length} items)`
      );
    },
    onError: (error: Error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "batch_update_checklist",
          applicationId,
        },
      });
      toast.error(`Failed to update checklist: ${error.message}`);
    },
  });

  const batchDelete = useMutation({
    mutationFn: (checklistIds: string[]) =>
      deleteChecklist(applicationId, checklistIds),
    onSuccess: (data, variables) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["checklist", applicationId],
        (old: ChecklistResponse) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.filter(
              (item: ChecklistItem) =>
                !variables.includes(item.checklist_id || "")
            ),
          };
        }
      );

      toast.success(
        `Checklist items deleted successfully (${variables.length} items)`
      );
    },
    onError: (error: Error) => {
      Sentry.captureException(error, {
        tags: {
          operation: "batch_delete_checklist",
          applicationId,
        },
      });

      // Provide more user-friendly error messages
      if (error.message.includes("not found")) {
        toast.error(
          "Some checklist items were already deleted or not found. Please refresh the page to see the current state."
        );
      } else {
        toast.error(`Failed to delete checklist items: ${error.message}`);
      }
    },
  });

  return {
    createItem,
    updateItem,
    deleteItem,
    batchSave,
    batchUpdate,
    batchDelete,
    updateItemDescription,
    isCreating: createItem.isPending,
    isUpdating: updateItem.isPending,
    isDeleting: deleteItem.isPending,
    isBatchSaving: batchSave.isPending,
    isBatchUpdating: batchUpdate.isPending,
    isBatchDeleting: batchDelete.isPending,
  };
}
