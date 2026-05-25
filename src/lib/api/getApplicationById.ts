import { fetcher } from "../fetcher";
import { ApplicationDetailsResponse } from "@/types/applications";
import { API_ENDPOINTS } from "@/lib/config/api";

export async function getApplicationById(
  id: string,
): Promise<ApplicationDetailsResponse> {
  return fetcher<ApplicationDetailsResponse>(
    API_ENDPOINTS.VISA_APPLICATIONS.BY_ID(id),
  );
}

export async function updateApplicationFields(
  leadId: string,
  fieldsToUpdate: Record<string, unknown>,
  recordType: string,
): Promise<Response> {
  return fetcher<Response>(API_ENDPOINTS.VISA_APPLICATIONS.UPDATE_FIELDS, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      leadId,
      recordType,
      fieldsToUpdate,
    }),
  });
}

export async function updateDeadlineForLodgement(
  leadId: string,
  deadlineDate: string,
  recordType: string,
): Promise<Response> {
  const requestBody = {
    leadId,
    recordType,
    fieldsToUpdate: {
      Deadline_For_Lodgment: deadlineDate,
    },
  };

  try {
    const response = await fetcher<Response>(
      API_ENDPOINTS.VISA_APPLICATIONS.UPDATE_FIELDS,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function updateChecklistRequested(
  leadId: string,
  checklistRequested: boolean,
  recordType: string,
): Promise<Response> {
  return fetcher<Response>(API_ENDPOINTS.VISA_APPLICATIONS.UPDATE_FIELDS, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      leadId,
      recordType,
      fieldsToUpdate: {
        Checklist_Requested: checklistRequested,
      },
    }),
  });
}
