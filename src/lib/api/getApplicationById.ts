import { fetcher } from "../fetcher";
import type { Application, ApplicationDetailsResponse } from "@/types/applications";
import { API_ENDPOINTS } from "@/lib/config/api";

function parseChecklistRemindersEnabled(
  value: unknown,
): boolean | undefined {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

/** Maps visa application GET payload variants to Application.checklist_reminders_enabled */
export function mapApplicationFromApi(
  raw: Application & Record<string, unknown>,
): Application {
  const enabled = parseChecklistRemindersEnabled(
    raw.checklist_reminders_enabled ??
      raw.Checklist_Reminders_Enabled ??
      raw.checklistRemindersEnabled,
  );
  if (enabled === undefined) return raw;
  return { ...raw, checklist_reminders_enabled: enabled };
}

export async function getApplicationById(
  id: string,
): Promise<ApplicationDetailsResponse> {
  const res = await fetcher<ApplicationDetailsResponse>(
    API_ENDPOINTS.VISA_APPLICATIONS.BY_ID(id),
  );
  if (!res?.data) return res;
  return {
    ...res,
    data: mapApplicationFromApi(res.data as Application & Record<string, unknown>),
  };
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
