import {
  getApplicationById,
  updateApplicationFields,
} from "@/lib/api/getApplicationById";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { revalidateApplicationCache } from "@/lib/actions/cache-actions";

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
  return useMutation({
    mutationFn: async ({
      leadId,
      fieldsToUpdate,
    }: {
      leadId: string;
      fieldsToUpdate: Record<string, unknown>;
    }) => {
      const response = await updateApplicationFields(leadId, fieldsToUpdate, "application");
      // Revalidate Next.js cache after successful update
      await revalidateApplicationCache(leadId);
      return response;
    },
    onSuccess: () => {
      toast.success("Application fields updated successfully.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update application fields: ${error.message}`);
    },
  });
}
