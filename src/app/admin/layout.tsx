import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminHeader } from "@/components/common/AdminHeader";

export const metadata: Metadata = {
  title: "WorldVisa DMS - Admin Portal",
  description: "Admin portal for WorldVisa Document Management System",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requiredRole="admin" redirectTo="/admin-login">
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        {children}
      </div>
    </AuthGuard>
  );
}
