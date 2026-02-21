import { ZOHO_BASE_URL } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";

export interface GlobalSearchParams {
  search: string;
  limit?: number;
  country?: "Australia" | "Canada";
}

export interface GlobalSearchApplication {
  id: string;
  Name: string;
  Email: string;
  Phone?: string;
  Created_Time?: string;
  Application_Handled_By?: string;
  DMS_Application_Status?: string;
  Package_Finalize?: boolean;
  Checklist_Requested?: boolean;
  Deadline_For_Lodgment?: string | null;
  Record_Type?: string;
  Application_Stage?: string;
  Quality_Check_From?: string | null;
  AttachmentCount?: number;
}

export interface RequestedReviewItem {
  _id: string;
  record_id: string;
  client_name: string;
  document_name: string;
  document_category?: string;
  requested_review: {
    requested_by: string;
    requested_to: string;
    status: string;
    _id: string;
    requested_at: string;
  };
}

export interface ChecklistRequestedItem {
  id: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Record_Type?: string;
  DMS_Application_Status?: string;
}

export interface QualityCheckItem {
  id: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Record_Type?: string;
  DMS_Application_Status?: string;
  Quality_Check_From?: string;
}

export interface GlobalSearchData {
  applications: GlobalSearchApplication[];
  requestedReview: RequestedReviewItem[];
  checklistRequested: ChecklistRequestedItem[];
  qualityCheck: QualityCheckItem[];
}

export interface GlobalSearchResponse {
  success: boolean;
  data: GlobalSearchData;
}

export async function globalSearch(
  params: GlobalSearchParams,
): Promise<GlobalSearchResponse> {
  const searchParams = new URLSearchParams({ search: params.search });
  if (params.limit) {
    searchParams.append("limit", String(params.limit));
  }
  if (params.country) {
    searchParams.append("country", params.country);
  }
  return fetcher<GlobalSearchResponse>(
    `${ZOHO_BASE_URL}/visa_applications/global-search?${searchParams.toString()}`,
  );
}
