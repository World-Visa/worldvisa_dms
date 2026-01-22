import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  checkClientAccount,
  updateClientAccount,
  createClientAccount,
  type CheckClientAccountResponse,
  type CheckClientAccountResult,
  type UpdateClientAccountPayload,
  type UpdateClientAccountResponse,
  type CreateClientAccountPayload,
  type CreateClientAccountResponse,
} from '@/lib/api/activateAccount';

const NOT_FOUND_MESSAGE = 'Client account not found';

function isNotFoundMessage(msg: string): boolean {
  return msg.includes(NOT_FOUND_MESSAGE);
}

interface UseCheckClientAccountOptions {
  onSuccess?: (data: CheckClientAccountResponse) => void;
  onError?: (error: Error) => void;
  onNotFound?: () => void;
}

export function useCheckClientAccount(options?: UseCheckClientAccountOptions) {
  return useMutation<CheckClientAccountResult, Error, string>({
    mutationFn: (leadId: string) => checkClientAccount(leadId),
    onSuccess: (data) => {
      if (data.status === 'fail' && isNotFoundMessage(data.message)) {
        options?.onNotFound?.();
        return;
      }
      if (data.status !== 'success') {
        const msg = data.status === 'fail' ? data.message : 'Check failed.';
        toast.error(msg);
        options?.onError?.(new Error(msg));
        return;
      }
      toast.success('Client account found.');
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (isNotFoundMessage(error.message)) {
        toast.info('Account not found.');
        options?.onNotFound?.();
        return;
      }
      console.error('Check client account failed:', error);
      toast.error(error.message || 'Failed to check account. Please try again.');
      options?.onError?.(error);
    },
  });
}

interface UseUpdateClientAccountOptions {
  onSuccess?: (data: UpdateClientAccountResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpdateClientAccount(options?: UseUpdateClientAccountOptions) {
  return useMutation<
    UpdateClientAccountResponse,
    Error,
    { leadId: string; payload: UpdateClientAccountPayload }
  >({
    mutationFn: ({ leadId, payload }) => updateClientAccount(leadId, payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Client account updated successfully.');
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Update client account failed:', error);
      toast.error(error.message || 'Failed to update account. Please try again.');
      options?.onError?.(error);
    },
  });
}

interface UseCreateClientAccountOptions {
  onSuccess?: (data: CreateClientAccountResponse) => void;
  onError?: (error: Error) => void;
}

export function useCreateClientAccount(options?: UseCreateClientAccountOptions) {
  return useMutation<CreateClientAccountResponse, Error, CreateClientAccountPayload>({
    mutationFn: (payload) => createClientAccount(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Account created successfully.');
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Create client account failed:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
      options?.onError?.(error);
    },
  });
}
