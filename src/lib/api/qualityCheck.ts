import { fetcher } from '@/lib/fetcher';
import { QualityCheckRequest, QualityCheckResponse as QualityCheckResponseType } from '@/types/common';

export interface QualityCheckApplication {
  Email: string;
  Quality_Check_From: string;
  Phone: string;
  Created_Time: string;
  Application_Handled_By: string;
  id: string;
  DMS_Application_Status: string;
  Name: string;
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
  params: QualityCheckParams = {}
): Promise<QualityCheckPaginatedResponse> {
  const searchParams = new URLSearchParams();
  
  // Add pagination parameters
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  
  // Add filter parameters
  if (params.name) searchParams.append('name', params.name);
  if (params.email) searchParams.append('email', params.email);
  if (params.phone) searchParams.append('phone', params.phone);
  if (params.status) searchParams.append('status', params.status);
  if (params.handledBy) searchParams.append('handledBy', params.handledBy);
  if (params.qualityCheckFrom) searchParams.append('qualityCheckFrom', params.qualityCheckFrom);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);

  const url = `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/quality_check?${searchParams.toString()}`;
  
  const response = await fetcher<QualityCheckResponse>(url);
  
  // Transform the response to match our paginated structure
  // Since the API doesn't return pagination info, we'll simulate it
  const page = params.page || 1;
  const limit = params.limit || 20;
  const totalItems = response.data?.length || 0;
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    success: response.success,
    data: response.data || [],
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      limit,
    },
  };
}

// Search quality check applications
export async function searchQualityCheckApplications(
  searchParams: Record<string, string>
): Promise<QualityCheckResponseType> {
  const urlParams = new URLSearchParams(searchParams);
  const url = `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/quality_check?${urlParams.toString()}`;
  
  return fetcher<QualityCheckResponseType>(url);
}

// Push application for quality check
export async function pushForQualityCheck(
  data: QualityCheckRequest,
  page: number = 1,
  limit: number = 10
): Promise<QualityCheckResponseType> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const url = `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/quality_check?${searchParams.toString()}`;
  
  return fetcher<QualityCheckResponseType>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}