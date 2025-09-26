import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ResetPasswordRequest {
  leadId: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface UseResetPasswordOptions {
  onSuccess?: (data: ResetPasswordResponse) => void;
  onError?: (error: Error) => void;
}

export function useResetPassword(options?: UseResetPasswordOptions) {
  const queryClient = useQueryClient();

  return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
    mutationFn: async ({ leadId, newPassword }) => {
      const response = await fetch('/api/zoho_dms/users/clients/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Password reset successfully!');
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Password reset failed:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
      options?.onError?.(error);
    },
  });
}
