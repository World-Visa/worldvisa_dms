import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ClientHeader } from "@/components/auth/ClientHeader";

export const metadata: Metadata = {
  title: "WorldVisa DMS - Client Portal",
  description: "Client portal for WorldVisa Document Management System",
};

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requiredRole="client" redirectTo="/client-login">
      <ClientHeader />
      {children}
    </AuthGuard>
  );
}
