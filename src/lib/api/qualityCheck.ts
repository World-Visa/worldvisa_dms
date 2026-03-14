import { fetcher } from "@/lib/fetcher";
import { ZOHO_BASE_URL } from "@/lib/config/api";
import type { QualityCheckRequest } from "@/types/common";

const QC_BASE = `${ZOHO_BASE_URL}/visa_applications/quality_check`;

// ─── Legacy types (used by old admin page and hooks) ───────────────────────

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
  message?: string;
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

export async function getQualityCheckApplications(
  params: QualityCheckParams = {},
): Promise<QualityCheckPaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
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

export async function searchQualityCheckApplications(
  searchParams: Record<string, string>,
): Promise<QualityCheckResponse> {
  const urlParams = new URLSearchParams(searchParams);
  const url = `${ZOHO_BASE_URL}/visa_applications/quality_check?${urlParams.toString()}`;
  return fetcher<QualityCheckResponse>(url);
}

export async function pushForQualityCheck(
  data: QualityCheckRequest,
  page = 1,
  limit = 10,
): Promise<QualityCheckResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  const url = `${ZOHO_BASE_URL}/visa_applications/quality_check?${searchParams.toString()}`;
  return fetcher<QualityCheckResponse>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ─── New v2 types ──────────────────────────────────────────────────────────

export interface QualityCheckListItem {
  id: string;
  Name: string;
  Email: string;
  Quality_Check_From: string;
  Application_Handled_By?: string;
  DMS_Application_Status: string;
  Created_Time: string;
  Record_Type?: string;
  qcId: string;
  qcStatus: "pending" | "reviewed" | "removed";
  messageCount: number;
  migrated: boolean;
  qcRequestedAt: string;
  qcRequestedBy?: string;
  qcRequestedTo?: string;
}

export interface QualityCheckDetails {
  _id: string;
  leadId: string;
  recordType: string;
  requested_by: string;
  requested_to: string;
  status: "pending" | "reviewed";
  migrated: boolean;
  messages: unknown[];
  requested_at: string;
}

export interface QualityCheckListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  country?: string;
  recordType?: string;
}

export interface QualityCheckListResponse {
  success: boolean;
  data: QualityCheckListItem[];
  totalCount: number;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface QualityCheckDetailsResponse {
  success: boolean;
  data: QualityCheckDetails;
}

export async function getQualityCheckList(
  params: QualityCheckListParams = {},
): Promise<QualityCheckListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.country) searchParams.set("country", params.country);
  if (params.recordType) searchParams.set("recordType", params.recordType);

  const url = `${QC_BASE}?${searchParams.toString()}`;
  return fetcher<QualityCheckListResponse>(url);
}

export async function requestQualityCheck(data: {
  leadId: string;
  reqUserName: string;
  recordType: string;
}): Promise<{ success: boolean; message: string }> {
  return fetcher<{ success: boolean; message: string }>(QC_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function removeQualityCheck(
  leadId: string,
  recordType: string,
): Promise<{ success: boolean; message: string }> {
  const url = `${QC_BASE}/${leadId}?recordType=${encodeURIComponent(recordType)}`;
  return fetcher<{ success: boolean; message: string }>(url, {
    method: "DELETE",
  });
}

export async function getQualityCheckDetails(
  leadId: string,
): Promise<QualityCheckDetailsResponse> {
  return fetcher<QualityCheckDetailsResponse>(
    `${QC_BASE}/${leadId}/details`,
  );
}

export async function updateQualityCheckStatus(
  qcId: string,
  status: "reviewed",
): Promise<{ success: boolean; data: QualityCheckDetails }> {
  return fetcher<{ success: boolean; data: QualityCheckDetails }>(
    `${QC_BASE}/${qcId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
}
