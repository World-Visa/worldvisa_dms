import { fetcher } from "@/lib/fetcher";
import { QualityCheckRequest } from "@/types/common";
import { ZOHO_BASE_URL } from "@/lib/config/api";

export interface QualityCheckApplication {
  Email: string;
  Quality_Check_From: string;
  Phone: string;
  Created_Time: string;
  Application_Handled_By: string;
  id: string;
  DMS_Application_Status?: string | null;
  Application_Stage?: string | null;
  Name: string;
  Record_Type?: string;
  Main_Applicant?: string | null;
}

/** Backend API response shape */
interface QualityCheckBackendResponse {
  success: boolean;
  data: QualityCheckApplication[];
  totalCount?: number;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface QualityCheckResponse {
  success: boolean;
  data: QualityCheckApplication[];
}

export interface QualityCheckParams {
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  handledBy?: string;
  qualityCheckFrom?: string;
  startDate?: string;
  endDate?: string;
}

export interface QualityCheckPaginatedResponse {
  success: boolean;
  data: QualityCheckApplication[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

// Fetch all quality check applications
export async function getQualityCheckApplications(
  params: QualityCheckParams = {},
): Promise<QualityCheckPaginatedResponse> {
  const searchParams = new URLSearchParams();

  // Add pagination parameters
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());

  // Add filter parameters
  if (params.name) searchParams.append("name", params.name);
  if (params.email) searchParams.append("email", params.email);
  if (params.phone) searchParams.append("phone", params.phone);
  if (params.status) searchParams.append("status", params.status);
  if (params.handledBy) searchParams.append("handledBy", params.handledBy);
  if (params.qualityCheckFrom)
    searchParams.append("qualityCheckFrom", params.qualityCheckFrom);
  if (params.startDate) searchParams.append("startDate", params.startDate);
  if (params.endDate) searchParams.append("endDate", params.endDate);

  const url = `${ZOHO_BASE_URL}/visa_applications/quality_check?${searchParams.toString()}`;

  const response = await fetcher<QualityCheckBackendResponse>(url);

  const page = params.page || 1;
  const limit = params.limit || 10;
  const p = response.pagination;

  // Map backend response: totalCount / pagination.totalRecords -> totalItems, pageSize -> limit
  const totalItems =
    response.totalCount ?? p?.totalRecords ?? response.data?.length ?? 0;
  const pageSize = p?.pageSize ?? limit;

  return {
    success: response.success,
    data: response.data || [],
    pagination: {
      currentPage: p?.currentPage ?? page,
      totalPages: p?.totalPages ?? Math.ceil(totalItems / pageSize),
      totalItems,
      limit: pageSize,
    },
  };
}

// Search quality check applications
export async function searchQualityCheckApplications(
  searchParams: Record<string, string>,
): Promise<QualityCheckResponse> {
  const urlParams = new URLSearchParams(searchParams);
  const url = `${ZOHO_BASE_URL}/visa_applications/quality_check?${urlParams.toString()}`;

  return fetcher<QualityCheckResponse>(url);
}

// Push application for quality check
export async function pushForQualityCheck(
  data: QualityCheckRequest,
  page: number = 1,
  limit: number = 10,
): Promise<QualityCheckResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const url = `${ZOHO_BASE_URL}/visa_applications/quality_check?${searchParams.toString()}`;

  return fetcher<QualityCheckResponse>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
