import { tokenStorage } from '../auth';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export interface AddDocumentRequest {
  applicationId: string;
  files: File[];
  document_name: string;
  document_category: string;
  uploaded_by: string;
  description?: string;
  document_type?: string;
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
  // Validate files on client side before sending
  data.files.forEach(file => {
    if (file.type !== 'application/pdf') {
      throw new Error(`File "${file.name}" is not a PDF file. Only PDF files are allowed.`);
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error(`File "${file.name}" does not have a PDF extension. Only PDF files are allowed.`);
    }
    if (file.size === 0) {
      throw new Error(`File "${file.name}" is empty. Please select a valid file.`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File "${file.name}" is too large. Maximum file size is 5MB.`);
    }
  });

  const formData = new FormData();
  
  // Add multiple files
  data.files.forEach(file => {
    formData.append('files', file);
  });
  
  // Add required parameters
  formData.append('document_name', data.document_name);
  formData.append('document_category', data.document_category);
  formData.append('uploaded_by', data.uploaded_by);
  
  // Add optional description if provided
  if (data.description) {
    formData.append('description', data.description);
  }
  
  // Add optional document_type if provided
  if (data.document_type) {
    formData.append('document_type', data.document_type);
  }

  // Get token from storage
  const token = data.token || tokenStorage.get();
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData - let the browser set it with boundary
  const url = `${ZOHO_BASE_URL}/visa_applications/${data.applicationId}/documents`;
  
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use the status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}
