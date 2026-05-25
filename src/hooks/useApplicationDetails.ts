import {
  getApplicationById,
  updateApplicationFields,
} from "@/lib/api/getApplicationById";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { revalidateApplicationCache } from "@/lib/actions/cache-actions";
import type { Application, ApplicationDetailsResponse } from "@/types/applications";

function mergeFieldsIntoApplication(
  data: Application,
  fieldsToUpdate: Record<string, unknown>,
): Application {
  const next = { ...data };
  if ("Stage" in fieldsToUpdate && typeof fieldsToUpdate.Stage === "string") {
    next.Application_Stage = fieldsToUpdate.Stage;
  }
  if (
    "Application_State" in fieldsToUpdate &&
    typeof fieldsToUpdate.Application_State === "string"
  ) {
    next.Application_State = fieldsToUpdate.Application_State;
  }
  return next;
}

export function useApplicationDetails(id: string) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplicationById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

export function useUpdateApplicationFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      recordType,
      fieldsToUpdate,
    }: {
      leadId: string;
      recordType: string;
      fieldsToUpdate: Record<string, unknown>;
    }) => {
      const response = await updateApplicationFields(
        leadId,
        fieldsToUpdate,
        recordType,
      );
      await revalidateApplicationCache(leadId);
      return response;
    },
    onSuccess: (_, variables) => {
      const patchApplication = (prev: ApplicationDetailsResponse | undefined) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: mergeFieldsIntoApplication(prev.data, variables.fieldsToUpdate),
        };
      };

      queryClient.setQueryData<ApplicationDetailsResponse>(
        ["application", variables.leadId],
        patchApplication,
      );
      queryClient.setQueriesData<ApplicationDetailsResponse>(
        { queryKey: ["spouse-application-details", variables.leadId] },
        patchApplication,
      );

      queryClient.invalidateQueries({
        queryKey: ["application", variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["spouse-application-details", variables.leadId],
      });

      toast.success("Application updated successfully.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update application fields: ${error.message}`);
    },
  });
}
