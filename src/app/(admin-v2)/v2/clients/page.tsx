import { ClientsManageClient } from "@/components/v2/clients/ClientsManageClient";
import { ClientsPageShell } from "@/components/v2/clients/ClientsPageShell";

export default function ClientsPage() {
  return (
    <ClientsPageShell>
      <ClientsManageClient />
    </ClientsPageShell>
  );
}
