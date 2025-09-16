import { fetcher } from '@/lib/fetcher';

export interface RequestedDocument {
  _id: string;
  record_id: string;
  workdrive_file_id: string;
  workdrive_parent_id: string;
  file_name: string;
  document_name?: string;
  document_category?: string;
  uploaded_by: string;
  status: 'pending' | 'approved' | 'reviewed' | 'rejected';
  reject_message?: string;
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
  requested_review: {
    requested_by: string;
    requested_to: string;
    status: 'pending' | 'approved' | 'rejected';
    _id: string;
    messages: unknown[];
  };
  // Computed properties added by the hook
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
}

/**
 * Fetches documents requested for review by the current user
 */
export async function getRequestedDocumentsToMe(
  params: RequestedDocumentsParams = {}
): Promise<RequestedDocumentsResponse> {
  const startTime = Date.now();
  
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.requested_by) searchParams.append('requested_by', params.requested_by);
    if (params.requested_to) searchParams.append('requested_to', params.requested_to);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);

    const url = `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/requested_reviews/all?${searchParams.toString()}`;
    
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

/**
 * Fetches documents that the current user has requested for review
 */
export async function getMyRequestedDocuments(
  params: RequestedDocumentsParams = {}
): Promise<RequestedDocumentsResponse> {
  const startTime = Date.now();
  
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.requested_by) searchParams.append('requested_by', params.requested_by);
    if (params.requested_to) searchParams.append('requested_to', params.requested_to);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);

    const url = `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/requested_reviews/all_me?${searchParams.toString()}`;
    
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

/**
 * Updates the status of a requested document review
 */
export async function updateRequestedDocumentStatus(
  documentId: string,
  status: 'approved' | 'rejected',
  message?: string
): Promise<{ success: boolean; message: string }> {
  const startTime = Date.now();
  
  try {
    const response = await fetcher(`https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews/status`, {
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
