"use client";

import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/nextjs";
import type { AppUser, ClerkPublicMetadata } from "@/types/auth";
import { isAdminRole } from "@/lib/roles";
import { ROUTES } from "@/utils/routes";

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useClerkAuth();

  const meta = clerkUser?.publicMetadata as ClerkPublicMetadata | undefined;

  const role = meta?.role ?? "client";
  const user: AppUser | null =
    isSignedIn && clerkUser
      ? {
          _id: meta?.user_id ?? "",
          role,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          username: isAdminRole(role)
            ? meta?.username ?? clerkUser.username ?? clerkUser.fullName ?? undefined
            : clerkUser.username ?? clerkUser.fullName ?? undefined,
          lead_id: meta?.lead_id,
          mcube_username: meta?.mcube_username,
        }
      : null;

  return {
    user,
    isAuthenticated: !!isSignedIn,
    isLoading: !isLoaded,
    getToken,
    logout: (queryClient?: { clear(): void }) => {
      queryClient?.clear();
      return signOut({ redirectUrl: ROUTES.SIGN_IN });
    },
  };
}
