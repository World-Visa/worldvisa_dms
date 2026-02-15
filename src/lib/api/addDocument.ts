import { tokenStorage } from "../auth";
import { ZOHO_BASE_URL } from "@/lib/config/api";

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

export async function addDocument(
  data: AddDocumentRequest,
): Promise<AddDocumentResponse> {
  // Validate files on client side before sending
  data.files.forEach((file) => {
    const fileName = file.name.toLowerCase();

    // Check if it's an identity photograph
    const isIdentityPhotograph =
      (data.document_category === "Identity Documents" ||
        data.document_category === "Identity") &&
      (data.document_name.toLowerCase().includes("photograph") ||
        data.document_name.toLowerCase().includes("photo") ||
        data.document_name.toLowerCase().includes("picture"));

    let allowedExtensions: string[];
    let allowedMimeTypes: string[];
    let errorMessage: string;

    if (isIdentityPhotograph) {
      // For identity photographs, only allow JPG/JPEG
      allowedExtensions = [".jpg", ".jpeg"];
      allowedMimeTypes = ["image/jpeg", "image/jpg"];
      errorMessage = `File "${file.name}" has an unsupported file type. Only JPG and JPEG files are allowed for photographs.`;
    } else {
      // For all other documents, allow PDF, Word, and text files
      allowedExtensions = [".pdf", ".doc", ".docx", ".txt"];
      allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      errorMessage = `File "${file.name}" has an unsupported file type. Only PDF, Word (.doc, .docx), and text (.txt) files are allowed.`;
    }

    // Check file extension
    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext),
    );
    if (!hasValidExtension) {
      throw new Error(errorMessage);
    }

    // Check MIME type
    const hasValidMimeType = allowedMimeTypes.includes(file.type);
    if (!hasValidMimeType) {
      throw new Error(errorMessage);
    }

    if (file.size === 0) {
      throw new Error(
        `File "${file.name}" is empty. Please select a valid file.`,
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        `File "${file.name}" is too large. Maximum file size is 5MB.`,
      );
    }
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
  const token = data.token || tokenStorage.get();

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData - let the browser set it with boundary
  const url = `${ZOHO_BASE_URL}/visa_applications/${data.applicationId}/documents`;

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
