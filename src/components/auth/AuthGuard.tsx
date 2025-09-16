"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client" | "master_admin";
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requiredRole,
  redirectTo = "/portal",
}: AuthGuardProps) {
  const { isAuthenticated, user, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };

    verifyAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking && !isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Check if user has access to admin pages (both admin and master_admin can access admin pages)
        if (
          requiredRole === "admin" &&
          (user?.role === "admin" || user?.role === "master_admin")
        ) {
          // Allow access to admin pages for both admin and master_admin roles
        } else {
          // Redirect to appropriate dashboard based on user role
          if (user?.role === "admin") {
            router.push("/admin/applications");
          } else if (user?.role === "client") {
            router.push("/client/dashboard");
          } else if (user?.role === "master_admin") {
            router.push("/admin/dashboard");
          } else {
            router.push(redirectTo);
          }
          return;
        }
      }
    }
  }, [
    isAuthenticated,
    user,
    isLoading,
    isChecking,
    requiredRole,
    redirectTo,
    router,
  ]);

  // Show loading spinner while checking authentication
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or wrong role
  if (!isAuthenticated) {
    return null;
  }

  // Check role access - allow master_admin to access admin pages
  if (requiredRole && user?.role !== requiredRole) {
    if (
      requiredRole === "admin" &&
      (user?.role === "admin" || user?.role === "master_admin")
    ) {
      // Allow access to admin pages for both admin and master_admin roles
    } else {
      return null;
    }
  }

  return <>{children}</>;
}
