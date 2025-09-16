import { fetcher } from '@/lib/fetcher';

export interface UpdateDocumentStatusRequest {
  status: 'pending' | 'approved' | 'rejected';
  changed_by: string;
  reject_message?: string;
}

export interface UpdateDocumentStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface DeleteRequestedDocumentRequest {
  reviewId: string;
}

export interface DeleteRequestedDocumentResponse {
  success: boolean;
  message: string;
}

export async function updateDocumentStatus(
  documentId: string,
  data: UpdateDocumentStatusRequest
): Promise<UpdateDocumentStatusResponse> {
  try {
    const response = await fetcher(`/api/zoho_dms/visa_applications/documents/${documentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response as UpdateDocumentStatusResponse;
  } catch (error) {
    console.error('Error updating document status:', error);
    throw new Error('Failed to update document status');
  }
}

export async function deleteRequestedDocument(
  documentId: string,
  data: DeleteRequestedDocumentRequest
): Promise<DeleteRequestedDocumentResponse> {
  try {
    const response = await fetcher(`/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response as DeleteRequestedDocumentResponse;
  } catch (error) {
    console.error('Error deleting requested document:', error);
    throw new Error('Failed to delete requested document');
  }
}
