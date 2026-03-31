import { InvitedClientsClient } from "@/components/v2/clients/InvitedClientsClient";
import { ClientsPageShell } from "@/components/v2/clients/ClientsPageShell";

export default function InvitedClientsPage() {
  return (
    <ClientsPageShell>
      <InvitedClientsClient />
    </ClientsPageShell>
  );
}
