import { tokenStorage } from "@/lib/auth";
import type {
  SampleDocumentsResponse,
  UploadSampleDocumentRequest,
  UploadSampleDocumentResponse,
  UpdateSampleDocumentRequest,
  DeleteSampleDocumentResponse,
} from "@/types/sampleDocuments";
import { ZOHO_BASE_URL } from "@/lib/config/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function fetchSampleDocuments(
  applicationId: string,
): Promise<SampleDocumentsResponse> {
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${ZOHO_BASE_URL}/visa_applications/${applicationId}/sample`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  return handleResponse<SampleDocumentsResponse>(response);
}

export async function uploadSampleDocument(
  request: UploadSampleDocumentRequest,
): Promise<UploadSampleDocumentResponse> {
  if (!request.files.length) {
    throw new Error("Please select at least one file to upload.");
  }

  const formData = new FormData();

  request.files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("document_name", request.document_name);
  formData.append("type", request.type ?? "skill-assessment");

  const token = tokenStorage.get();

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${ZOHO_BASE_URL}/visa_applications/${request.applicationId}/sample`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
  });

  return handleResponse<UploadSampleDocumentResponse>(response);
}

export async function updateSampleDocument(
  request: UpdateSampleDocumentRequest,
): Promise<UploadSampleDocumentResponse> {
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${ZOHO_BASE_URL}/visa_applications/${request.applicationId}/sample/${request.documentId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(request.data),
  });

  return handleResponse<UploadSampleDocumentResponse>(response);
}

export async function deleteSampleDocument(
  applicationId: string,
  documentId: string,
): Promise<DeleteSampleDocumentResponse> {
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${ZOHO_BASE_URL}/visa_applications/${applicationId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ document_id: documentId }),
  });

  return handleResponse<DeleteSampleDocumentResponse>(response);
}
