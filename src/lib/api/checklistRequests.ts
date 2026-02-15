import { fetcher } from "@/lib/fetcher";
import { API_CONFIG, getFullUrl } from "@/lib/config/api";

export interface ChecklistRequestItem {
  id: string; // This is the lead_id
  Name: string;
  Email: string;
  Phone: string;
  Created_Time: string;
  Application_Handled_By: string;
  DMS_Application_Status?: string;
  Deadline_For_Lodgment?: string | null;
  Checklist_Requested: boolean;
  Record_Type?: string;
}

export interface ChecklistRequestsResponse {
  success: boolean;
  data: ChecklistRequestItem[];
  pagination: {
    currentPage: number | string;
    totalPages: number;
    totalItems: number;
  };
}

export interface ChecklistRequestsParams {
  page?: number;
  limit?: number;
}

/**
 * Fetches all applications that have requested checklists (Admin)
 */
export async function getChecklistRequests(
  params: ChecklistRequestsParams = {},
): Promise<ChecklistRequestsResponse> {
  try {
    const { page = 1, limit = 20 } = params;

    // Use the centralized API configuration (Admin endpoint)
    const fullUrl = getFullUrl(API_CONFIG.ENDPOINTS.CHECKLIST_REQUESTS.LIST, {
      page,
      limit,
    });

    const response = await fetcher<ChecklistRequestsResponse>(fullUrl);

    // Validate response structure
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from server");
    }

    if (!Array.isArray(response.data)) {
      throw new Error(
        "Invalid data format: expected array of checklist requests",
      );
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
      throw new Error(`Failed to fetch checklist requests: ${error.message}`);
    }

    // Fallback for unknown errors
    throw new Error(
      "An unexpected error occurred while fetching checklist requests. Please try again.",
    );
  }
}

/**
 * Fetches a single checklist request by lead ID
 */
export async function getChecklistRequestByLeadId(
  leadId: string,
): Promise<ChecklistRequestItem | null> {
  try {
    if (!leadId || typeof leadId !== "string") {
      throw new Error("Lead ID is required and must be a string");
    }

    // Use the centralized API configuration
    const endpoint = API_CONFIG.ENDPOINTS.CHECKLIST_REQUESTS.BY_ID(leadId);

    const response = await fetcher<{ data: ChecklistRequestItem }>(endpoint);

    return response?.data || null;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch checklist request: ${error.message}`);
    }
    throw new Error(
      "An unexpected error occurred while fetching checklist request.",
    );
  }
}
