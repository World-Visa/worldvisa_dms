import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getQualityCheckList,
  getQualityCheckDetails,
  requestQualityCheck,
  removeQualityCheck,
  updateQualityCheckStatus,
  type QualityCheckListParams,
  type QualityCheckListItem,
  type QualityCheckListResponse,
  type QualityCheckDetails,
} from "@/lib/api/qualityCheck";

export const QC_LIST_KEY = "quality-check-list";
export const QC_DETAILS_KEY = "quality-check-details";

export function useQualityCheckList(
  params: QualityCheckListParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [QC_LIST_KEY, params],
    queryFn: () => getQualityCheckList(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: options?.enabled !== false,
  });
}

export function useQualityCheckDetails(
  leadId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [QC_DETAILS_KEY, leadId],
    queryFn: () => getQualityCheckDetails(leadId),
    enabled: !!leadId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRequestQualityCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestQualityCheck,
    onSuccess: () => {
      toast.success("Quality check requested successfully");
      queryClient.invalidateQueries({ queryKey: [QC_LIST_KEY] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to request quality check: ${error.message}`);
    },
  });
}

export function useRemoveQualityCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      recordType,
    }: {
      leadId: string;
      recordType: string;
    }) => removeQualityCheck(leadId, recordType),
    onSuccess: () => {
      toast.success("Quality check removed");
      queryClient.invalidateQueries({ queryKey: [QC_LIST_KEY] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove quality check: ${error.message}`);
    },
  });
}

export function useUpdateQualityCheckStatus() {
  const queryClient = useQueryClient();

  type Context = {
    previousData: [readonly unknown[], QualityCheckListResponse | undefined][];
  };

  return useMutation<
    { success: boolean; data: QualityCheckDetails },
    Error,
    { qcId: string; status: "reviewed" },
    Context
  >({
    mutationFn: ({ qcId, status }) => updateQualityCheckStatus(qcId, status),
    onMutate: async ({ qcId }) => {
      await queryClient.cancelQueries({ queryKey: [QC_LIST_KEY] });

      const previousData = queryClient.getQueriesData<QualityCheckListResponse>(
        { queryKey: [QC_LIST_KEY] },
      );

      queryClient.setQueriesData<QualityCheckListResponse>(
        { queryKey: [QC_LIST_KEY] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item: QualityCheckListItem) =>
              item.qcId === qcId
                ? { ...item, qcStatus: "reviewed" as const }
                : item,
            ),
          };
        },
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Marked as reviewed");
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(`Failed to update status: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QC_LIST_KEY] });
    },
  });
}
