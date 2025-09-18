import { fetcher } from "../fetcher";
import { ApplicationDetailsResponse } from "@/types/applications";

const ZOHO_BASE_URL =
  "https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms";

export async function getApplicationById(
  id: string
): Promise<ApplicationDetailsResponse> {
  return fetcher<ApplicationDetailsResponse>(
    `${ZOHO_BASE_URL}/visa_applications/${id}`
  );
}

export async function updateApplicationFields(
  leadId: string,
  fieldsToUpdate: Record<string, unknown>
): Promise<Response> {
  return fetcher<Response>(`${ZOHO_BASE_URL}/visa_applications/update_fields`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      leadId,
      fieldsToUpdate,
    }),
  });
}
