import { fetcher } from "@/lib/fetcher";
import { API_CONFIG } from "@/lib/config/api";

export interface ChecklistRequestPayload {
  leadId: string;
  checklistRequested: boolean;
}

export interface ChecklistRequestResponse {
  status: string;
  message: string;
  data?: {
    checklistRequested: boolean;
    requestedAt: string;
  };
}

/**
 * Requests a checklist for a specific application
 */
export async function requestChecklist(
  payload: ChecklistRequestPayload,
): Promise<ChecklistRequestResponse> {
  try {
    // Input validation
    if (!payload.leadId || typeof payload.leadId !== "string") {
      throw new Error("Lead ID is required and must be a string");
    }

    if (typeof payload.checklistRequested !== "boolean") {
      throw new Error("checklistRequested must be a boolean value");
    }

    const endpoint = API_CONFIG.ENDPOINTS.CLIENT_CHECKLIST_REQUESTS.LIST;

    const response = await fetcher<ChecklistRequestResponse>(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Validate response structure
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from server");
    }

    return response;
  } catch (error) {
    // Enhanced error handling with specific error types
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Network error: Unable to connect to server. Please check your internet connection.",
      );
    }

    if (error instanceof Error) {
      // Re-throw with additional context
      throw new Error(`Failed to request checklist: ${error.message}`);
    }

    // Fallback for unknown errors
    throw new Error(
      "An unexpected error occurred while requesting checklist. Please try again.",
    );
  }
}

/**
 * Checks if a checklist has been requested for a specific application
 */
export async function getChecklistRequestStatus(
  leadId: string,
): Promise<boolean> {
  try {
    if (!leadId || typeof leadId !== "string") {
      throw new Error("Lead ID is required and must be a string");
    }

    // This would be implemented when the backend supports checking status
    // For now, we'll rely on the application details from the client
    const endpoint = `${API_CONFIG.BASE_URL}/visa_applications/${leadId}/checklist-status`;

    const response = await fetcher<{ checklistRequested: boolean }>(endpoint, {
      method: "GET",
    });

    return response?.checklistRequested || false;
  } catch (error) {
    console.warn("Could not fetch checklist request status:", error);
    return false;
  }
}
