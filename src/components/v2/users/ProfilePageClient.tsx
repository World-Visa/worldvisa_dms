"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserDetailsClient } from "./UserDetailsClient";

export function ProfilePageClient() {
  const { user } = useAuth();

  if (!user?._id) {
    return null;
  }

  const showChangePassword =
    user.role === "master_admin" || user.role === "supervisor";

  return (
    <UserDetailsClient id={user._id} showChangePassword={showChangePassword} />
  );
}
