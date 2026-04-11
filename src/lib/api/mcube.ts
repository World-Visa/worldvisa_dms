import { fetcher } from "@/lib/fetcher";
import { API_ENDPOINTS } from "@/lib/config/api";

/**
 * Initiate an outbound call via the backend MCube integration.
 * The agent's phone number (exenumber) is resolved server-side
 * from the authenticated user's agent_number profile field.
 */
export async function initiateOutboundCall(custnumber: string, exenumber?: string | null): Promise<void> {
  await fetcher<{ success: boolean }>(API_ENDPOINTS.MCUBE.OUTBOUND_CALL, {
    method: "POST",
    body: JSON.stringify({ custnumber, exenumber }),
  });
}
