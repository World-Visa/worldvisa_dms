import { ZOHO_BASE_URL } from "@/lib/config/api";

export interface DeleteDocumentResponse {
  success: boolean;
  message?: string;
}

export async function deleteDocument(
  documentId: string,
): Promise<DeleteDocumentResponse> {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await fetch(
    `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP error! status: ${response.status}`,
    );
  }

  // Handle 204 No Content response
  if (response.status === 204) {
    return {
      success: true,
      message: "Document deleted successfully",
    };
  }

  // Handle other successful responses with JSON content
  return response.json();
}
