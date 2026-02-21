"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { AdminLoginRequest, ClientLoginRequest } from "@/types/auth";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";
import { ZOHO_BASE_URL } from "@/lib/config/api";

export function useAdminLogin() {
  const { login, clearError } = useAuth();

  return useMutation({
    mutationFn: async (credentials: AdminLoginRequest & { rememberMe?: boolean }) => {
      const { rememberMe, ...creds } = credentials;
      return await login(creds, "admin", rememberMe);
    },
    onError: (error) => {
      console.error("Admin login error:", error);
    },
    onSuccess: () => {
      clearError();
    },
  });
}

export function useClientLogin() {
  const { login, clearError } = useAuth();

  return useMutation({
    mutationFn: async (credentials: ClientLoginRequest & { rememberMe?: boolean }) => {
      clearError();
      const { rememberMe, ...creds } = credentials;
      return await login(creds, "client", rememberMe);
    },
    onError: (error) => {
      console.error("Client login error:", error);
    },
    onSuccess: () => {
      clearError();
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logout(queryClient);
    },
  });
}

interface ResetPasswordPayload {
  newPassword: string;
}

const resetPassword = (payload: ResetPasswordPayload) => {
  return fetcher(`${ZOHO_BASE_URL}/clients/reset_password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Password has been reset successfully.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset password: ${error.message}`);
    },
  });
}
