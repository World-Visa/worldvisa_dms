"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuardV2({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setChecked(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (checked && !isAuthenticated) {
      router.replace("/auth/admin/login");
    }
  }, [checked, isAuthenticated, router]);

  if (!checked || !isAuthenticated) return null;
  return <>{children}</>;
}
