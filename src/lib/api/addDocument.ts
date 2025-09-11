import { fetcher } from '../fetcher';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export interface AddDocumentRequest {
  applicationId: string;
  files: File[];
  document_name: string;
  document_category: string;
  uploaded_by: string;
  token?: string;
}

export interface AddDocumentResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    size: number;
    type: string;
    uploaded_at: string;
  }[];
  message?: string;
}

export async function addDocument(data: AddDocumentRequest): Promise<AddDocumentResponse> {
  const formData = new FormData();
  
  // Add multiple files
  data.files.forEach(file => {
    formData.append('files', file);
  });
  
  // Add required parameters
  formData.append('document_name', data.document_name);
  formData.append('document_category', data.document_category);
  formData.append('uploaded_by', data.uploaded_by);

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
