import { fetcher } from '../fetcher';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export interface AddDocumentRequest {
  applicationId: string;
  file: File;
  token?: string;
  uploaded_by?: string;
}

export interface AddDocumentResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    size: number;
    type: string;
    uploaded_at: string;
  };
  message?: string;
}

export async function addDocument(data: AddDocumentRequest): Promise<AddDocumentResponse> {
  const formData = new FormData();
  formData.append('file', data.file);

  const headers: Record<string, string> = {};
  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  return fetcher<AddDocumentResponse>(`${ZOHO_BASE_URL}/visa_applications/${data.applicationId}/documents`, {
    method: 'POST',
    body: formData,
    headers,
  });
}
