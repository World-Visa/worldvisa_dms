import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getClientProfile,
  updateClientProfile,
  type UpdateClientProfilePayload,
} from '@/lib/api/clientProfile';

export function useClientProfile(leadId: string, enabled = true) {
  return useQuery({
    queryKey: ['clientProfile', leadId],
    queryFn: () => getClientProfile(leadId),
    enabled: enabled && !!leadId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateClientProfile(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateClientProfilePayload) => updateClientProfile(leadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile', leadId] });
      toast.success('Profile updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to update profile.');
    },
  });
}
