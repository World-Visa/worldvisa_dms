import { fetcher } from '@/lib/fetcher';
import { API_CONFIG, getFullUrl, ZOHO_BASE_URL } from '@/lib/config/api';

export interface RequestedDocument {
  _id: string;
  record_id: string;
  workdrive_file_id: string;
  workdrive_parent_id: string;
  file_name: string;
  document_name?: string;
  document_category?: string;
  uploaded_by: string;
  status: 'pending' | 'reviewed';
  review_message?: string;
  history: Array<{
    status: string;
    changed_by: string;
    _id: string;
    changed_at: string;
  }>;
  uploaded_at: string;
  download_url?: string;
  document_link?: string;
  comments: Array<{
    _id: string;
    comment: string;
    added_by: string;
    added_at: string;
  }>;
  __v: number;
  client_name?: string;
  requested_review: {
    requested_by: string;
    requested_to: string;
    status: 'pending' | 'reviewed';
    _id: string;
    messages: unknown[];
    requested_at: string;
  };
  requested_reviews?: Array<{
    requested_by: string;
    requested_to: string;
    status: 'pending' | 'reviewed';
    _id: string;
    messages: unknown[];
    requested_at: string;
  }>;
  isOverdue?: boolean;
  daysSinceRequest?: number;
  priority?: 'high' | 'medium' | 'low';
  formattedUploadDate?: string;
  formattedRequestDate?: string;
}

export interface RequestedDocumentsResponse {
  status: 'success' | 'error';
  data: RequestedDocument[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface RequestedDocumentsParams {
  page?: number;
  limit?: number;
  status?: string;
  requested_by?: string;
  requested_to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}


export async function getRequestedDocumentsToMe(
  params: RequestedDocumentsParams = {}
): Promise<RequestedDocumentsResponse> {
  const startTime = Date.now();

  try {
    const defaultParams = {
      ...params,
      sort: 'requested_at',
      order: 'desc' as const
    };

    const searchParams = new URLSearchParams();

    if (defaultParams.page) searchParams.append('page', defaultParams.page.toString());
    if (defaultParams.limit) searchParams.append('limit', defaultParams.limit.toString());
    if (defaultParams.status) searchParams.append('status', defaultParams.status);
    if (defaultParams.requested_by) searchParams.append('requested_by', defaultParams.requested_by);
    if (defaultParams.requested_to) searchParams.append('requested_to', defaultParams.requested_to);
    if (defaultParams.sort) searchParams.append('sort', defaultParams.sort);
    if (defaultParams.order) searchParams.append('order', defaultParams.order);

    const url = getFullUrl(API_CONFIG.ENDPOINTS.REQUESTED_DOCUMENTS.ALL_TO, defaultParams);
    
    const response = await fetcher(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }) as RequestedDocumentsResponse;

    const responseTime = Date.now() - startTime;

    if (responseTime > 3000) {
      console.warn(`Slow requested documents response: ${responseTime}ms`);
    }

    if (response.status !== 'success') {
      throw new Error('Failed to fetch requested documents');
    }

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Failed to fetch requested documents:', {
      params,
      error,
      responseTime
    });

    throw error;
  }
}


export async function getMyRequestedDocuments(
  params: RequestedDocumentsParams = {}
): Promise<RequestedDocumentsResponse> {
  const startTime = Date.now();

  try {
    const defaultParams = {
      ...params,
      sort: 'requested_at',
      order: 'desc' as const
    };

    const searchParams = new URLSearchParams();

    if (defaultParams.page) searchParams.append('page', defaultParams.page.toString());
    if (defaultParams.limit) searchParams.append('limit', defaultParams.limit.toString());
    if (defaultParams.status) searchParams.append('status', defaultParams.status);
    if (defaultParams.requested_by) searchParams.append('requested_by', defaultParams.requested_by);
    if (defaultParams.requested_to) searchParams.append('requested_to', defaultParams.requested_to);
    if (defaultParams.sort) searchParams.append('sort', defaultParams.sort);
    if (defaultParams.order) searchParams.append('order', defaultParams.order);

    const url = getFullUrl(API_CONFIG.ENDPOINTS.REQUESTED_DOCUMENTS.ALL_ME, defaultParams);
    
    const response = await fetcher(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }) as RequestedDocumentsResponse;

    const responseTime = Date.now() - startTime;

    if (responseTime > 3000) {
      console.warn(`Slow my requested documents response: ${responseTime}ms`);
    }

    if (response.status !== 'success') {
      throw new Error('Failed to fetch my requested documents');
    }

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Failed to fetch my requested documents:', {
      params,
      error,
      responseTime
    });

    throw error;
  }
}

export async function updateRequestedDocumentStatus(
  documentId: string,
  status: 'reviewed',
  message?: string
): Promise<{ success: boolean; message: string }> {
  const startTime = Date.now();
  
  try {
    const response = await fetcher(`${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        message
      }),
    }) as { success: boolean; message: string };

    const responseTime = Date.now() - startTime;

    if (responseTime > 3000) {
      console.warn(`Slow status update response: ${responseTime}ms`);
    }

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Failed to update document status:', {
      documentId,
      status,
      message,
      error,
      responseTime
    });

    throw error;
  }
}


export async function getAllRequestedDocuments(
  page: number = 1,
  limit: number = 10,
  filters: Omit<RequestedDocumentsParams, 'page' | 'limit'> = {}
): Promise<RequestedDocumentsResponse> {
  const defaultFilters = {
    ...filters,
    sort: 'requested_at',
    order: 'desc' as const
  };

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (defaultFilters.status) searchParams.append('status', String(defaultFilters.status));
  if (defaultFilters.requested_by) searchParams.append('requested_by', String(defaultFilters.requested_by));
  if (defaultFilters.requested_to) searchParams.append('requested_to', String(defaultFilters.requested_to));
  if (defaultFilters.sort) searchParams.append('sort', String(defaultFilters.sort));
  if (defaultFilters.order) searchParams.append('order', String(defaultFilters.order));

  return fetcher<RequestedDocumentsResponse>(
    getFullUrl(API_CONFIG.ENDPOINTS.REQUESTED_DOCUMENTS.ALL, { page, limit, ...defaultFilters })
  );
}
