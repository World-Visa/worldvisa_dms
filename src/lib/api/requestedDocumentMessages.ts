import { fetcher } from "@/lib/fetcher";
import { API_CONFIG } from "@/lib/config/api";

export interface RequestedDocumentMessage {
  _id: string;
  message: string;
  username: string;
  added_at: string;
}

export interface RequestedDocumentMessagesResponse {
  status: "success" | "error";
  data: RequestedDocumentMessage[];
  message?: string;
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  status: "success" | "error";
  data: {
    _id: string;
    message: string;
    username: string;
    added_at: string;
  };
  message?: string;
}

export interface DeleteMessageRequest {
  messageId: string;
}

export interface DeleteMessageResponse {
  status: "success" | "error";
  message?: string;
}

/**
 * Fetch messages for a specific requested document review
 */
export async function getRequestedDocumentMessages(
  documentId: string,
  reviewId: string,
): Promise<RequestedDocumentMessagesResponse> {
  return fetcher<RequestedDocumentMessagesResponse>(
    API_CONFIG.ENDPOINTS.REVIEW_REQUEST_MESSAGES(documentId, reviewId),
  );
}

/**
 * Send a message for a specific requested document review
 */
export async function sendRequestedDocumentMessage(
  documentId: string,
  reviewId: string,
  data: SendMessageRequest,
): Promise<SendMessageResponse> {
  return fetcher<SendMessageResponse>(
    API_CONFIG.ENDPOINTS.REVIEW_REQUEST_MESSAGES(documentId, reviewId),
    {
      method: "POST",
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    },
  );
}

/**
 * Delete a message from a specific requested document review
 */
export async function deleteRequestedDocumentMessage(
  documentId: string,
  reviewId: string,
  data: DeleteMessageRequest,
): Promise<DeleteMessageResponse> {
  return fetcher<DeleteMessageResponse>(
    API_CONFIG.ENDPOINTS.REVIEW_REQUEST_MESSAGES(documentId, reviewId),
    {
      method: "DELETE",
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    },
  );
}
