'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { AdminLoginRequest, ClientLoginRequest } from '@/types/auth';

export function useAdminLogin() {
  const { login, clearError } = useAuth();

  return useMutation({
    mutationFn: async (credentials: AdminLoginRequest) => {
      return await login(credentials, 'admin');
    },
    onError: (error) => {
      console.error('Admin login error:', error);
    },
    onSuccess: () => {
      clearError();
    },
  });
}

export function useClientLogin() {
  const { login, clearError } = useAuth();

  return useMutation({
    mutationFn: async (credentials: ClientLoginRequest) => {
      // Clear any previous errors before attempting login
      clearError();
      return await login(credentials, 'client');
    },
    onError: (error) => {
      console.error('Client login error:', error);
      // Don't clear error here - let the form handle it
    },
    onSuccess: () => {
      clearError();
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      logout();
    },
  });
}
