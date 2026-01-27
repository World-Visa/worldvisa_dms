import { fetcher } from "../fetcher";
import { ApplicationDetailsResponse } from "@/types/applications";
import { ZOHO_BASE_URL } from '@/lib/config/api';

export async function getApplicationById(
  id: string
): Promise<ApplicationDetailsResponse> {
  return fetcher<ApplicationDetailsResponse>(
    `${ZOHO_BASE_URL}/visa_applications/${id}`
  );
}

export async function updateApplicationFields(
  leadId: string,
  fieldsToUpdate: Record<string, unknown>,
  recordType: string
): Promise<Response> {
  return fetcher<Response>(`${ZOHO_BASE_URL}/visa_applications/update_fields`, {
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
  recordType: string
): Promise<Response> {
  const requestBody = {
    leadId,
    recordType,
    fieldsToUpdate: {
      Deadline_For_Lodgment: deadlineDate,
    },
  };
  
  try {
    const response = await fetcher<Response>(`${ZOHO_BASE_URL}/visa_applications/update_fields`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function updateChecklistRequested(
  leadId: string,
  checklistRequested: boolean,
  recordType: string
): Promise<Response> {
  return fetcher<Response>(`${ZOHO_BASE_URL}/visa_applications/update_fields`, {
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