import { Document } from '@/types/applications';
import { fetcher } from '../fetcher';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export interface PaginatedDocumentsResponse {
  success: boolean;
  data: Document[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

export interface GetPaginatedDocumentsRequest {
  applicationId: string;
  page?: number;
  limit?: number;
  token?: string;
}

export async function getApplicationDocumentsPaginated(
  data: GetPaginatedDocumentsRequest
): Promise<PaginatedDocumentsResponse> {
  const { applicationId, page = 1, limit = 10, token } = data;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetcher<PaginatedDocumentsResponse>(
    `${ZOHO_BASE_URL}/visa_applications/${applicationId}/documents?${params}`,
    {
      method: 'GET',
      headers,
    }
  );
}
