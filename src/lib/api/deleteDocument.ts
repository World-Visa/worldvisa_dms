import { fetcher } from '../fetcher';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export interface DeleteDocumentResponse {
  success: boolean;
  message?: string;
}

export async function deleteDocument(documentId: string): Promise<DeleteDocumentResponse> {
  return fetcher<DeleteDocumentResponse>(`${ZOHO_BASE_URL}/visa_applications/164193000015083689/folders/${documentId}`, {
    method: 'DELETE',
  });
}
