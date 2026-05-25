import { API_ENDPOINTS } from "@/lib/config/api";
import { fetcher } from "../fetcher";

export async function patchChecklistReminders(
  leadId: string,
  body: { enabled: boolean },
): Promise<Response> {
  return fetcher<Response>(
    API_ENDPOINTS.VISA_APPLICATIONS.CHECKLIST_REMINDERS(leadId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}
