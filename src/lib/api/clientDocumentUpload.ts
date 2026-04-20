import { getClerkToken } from "../getToken";
import { ZOHO_BASE_URL } from "@/lib/config/api";
import { assertUploadFileValid } from "@/lib/documents/fileFormats";

export interface ClientUploadDocumentRequest {
  clientId: string;
  files: File[];
  document_name: string;
  document_category: string;
  uploaded_by: string;
  description?: string;
  document_type?: string;
  /** Checklist `format` keys from DB; drives allowed extensions/MIMEs (non–identity-photo). */
  templateFormats?: string[];
  token?: string;
}

export interface ClientUploadDocumentResponse {
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

export async function clientUploadDocument(
  data: ClientUploadDocumentRequest,
): Promise<ClientUploadDocumentResponse> {
  data.files.forEach((file) => {
    assertUploadFileValid(
      file,
      data.document_category,
      data.document_name,
      data.templateFormats,
    );
  });

  const formData = new FormData();

  // Add multiple files
  data.files.forEach((file) => {
    formData.append("files", file);
  });

  // Add required parameters
  formData.append("document_name", data.document_name);
  formData.append("document_category", data.document_category);
  formData.append("uploaded_by", data.uploaded_by);

  // Add optional description if provided
  if (data.description) {
    formData.append("description", data.description);
  }

  // Add optional document_type if provided
  if (data.document_type) {
    formData.append("document_type", data.document_type);
  }

  // Get token from storage
  const token = data.token || await getClerkToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData - let the browser set it with boundary
  const url = `${ZOHO_BASE_URL}/clients/${data.clientId}/documents`;

  const response = await fetch(url, {
    method: "POST",
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

export interface ClientReuploadDocumentRequest {
  clientId: string;
  documentId: string;
  file: File;
  document_name: string;
  document_category: string;
  uploaded_by: string;
  description?: string;
  templateFormats?: string[];
  token?: string;
}

export interface ClientReuploadDocumentResponse {
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

export async function clientReuploadDocument(
  data: ClientReuploadDocumentRequest,
): Promise<ClientReuploadDocumentResponse> {
  assertUploadFileValid(
    data.file,
    data.document_category,
    data.document_name,
    data.templateFormats,
  );

  const formData = new FormData();

  // Add file
  formData.append("files", data.file);

  // Add required parameters
  formData.append("document_name", data.document_name);
  formData.append("document_category", data.document_category);
  formData.append("uploaded_by", data.uploaded_by);

  if (data.description) {
    formData.append("description", data.description);
  }

  // Get token from storage
  const token = data.token || await getClerkToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData - let the browser set it with boundary
  const url = `${ZOHO_BASE_URL}/clients/${data.clientId}/documents/${data.documentId}`;

  const response = await fetch(url, {
    method: "PATCH",
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
