import type { Metadata } from "next";
import { ClientHeader } from "@/components/auth/ClientHeader";
import { ClientQueryClearOnSignOut } from "@/components/client/clear-query-on-sign-out";
import { NotificationPrompt } from "@/components/NotificationPrompt";

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
    <>
      <ClientQueryClearOnSignOut />
      <ClientHeader />
      <NotificationPrompt />
      {children}
    </>
  );
}
