"use client";

import { useAuth } from "@/hooks/useAuth";
import { isAdminRole, isClientRole } from "@/lib/roles";

export function useHasPermission() {
  const { user, isLoading } = useAuth();
  return {
    isAdmin: isAdminRole(user?.role),
    isClient: isClientRole(user?.role),
    isLoading,
  };
}
