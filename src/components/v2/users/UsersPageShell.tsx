import type { ReactNode } from "react";
import { InviteUserModal } from "./InviteUserModal";
import { UsersPageTabs } from "./UsersPageTabs";

interface UsersPageShellProps {
  children: ReactNode;
}

export function UsersPageShell({ children }: UsersPageShellProps) {
  return (
    <main className="flex flex-col gap-0">
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-2xl tracking-tight">Manage Users</h1>
        <InviteUserModal />
      </div>
      <UsersPageTabs>{children}</UsersPageTabs>
    </main>
  );
}
