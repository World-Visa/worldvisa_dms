import { getClerkToken } from "../getToken";
import { API_ENDPOINTS } from "@/lib/config/api";

export interface DeleteDocumentResponse {
  success: boolean;
  message?: string;
}

export async function deleteDocument(
  documentId: string,
): Promise<DeleteDocumentResponse> {
  const token = await getClerkToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    API_ENDPOINTS.VISA_APPLICATIONS.DOCUMENTS.BY_ID(documentId),
    { method: "DELETE", headers },
  );

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

  const text = await response.text();
  if (!text.trim()) return { success: true, message: "Document deleted successfully" };
  return JSON.parse(text);
}
