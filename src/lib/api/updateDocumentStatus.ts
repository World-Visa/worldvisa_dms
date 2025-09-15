import { fetcher } from '../fetcher';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export interface UpdateDocumentStatusRequest {
  status: 'pending' | 'reviewed' | 'request_review' | 'approved' | 'rejected';
  changed_by: string;
  reject_message?: string;
}

export interface UpdateDocumentStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    status: string;
    changed_by: string;
    changed_at: string;
  };
}

export async function updateDocumentStatus(
  documentId: string,
  data: UpdateDocumentStatusRequest
): Promise<UpdateDocumentStatusResponse> {
  return fetcher<UpdateDocumentStatusResponse>(
    `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}
