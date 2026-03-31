import type { ReactNode } from "react";
import { UsersPageTabs, type PageTab } from "@/components/v2/users/UsersPageTabs";
import { ROUTES } from "@/utils/routes";

const CLIENTS_TABS: PageTab[] = [
  { value: "all-clients", label: "All Clients", path: ROUTES.CLIENTS },
  { value: "invited", label: "Invitations", path: ROUTES.CLIENT_INVITATIONS },
];

interface ClientsPageShellProps {
  children: ReactNode;
}

export function ClientsPageShell({ children }: ClientsPageShellProps) {
  return (
    <main className="flex flex-col gap-0">
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-2xl tracking-tight">Manage Clients</h1>
      </div>
      <UsersPageTabs tabs={CLIENTS_TABS}>{children}</UsersPageTabs>
    </main>
  );
}
