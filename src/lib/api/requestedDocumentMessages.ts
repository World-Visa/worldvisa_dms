import { fetcher } from '@/lib/fetcher';

export interface RequestedDocumentMessage {
  _id: string;
  message: string;
  sent_by: string;
  sent_at: string;
  review_id: string;
}

export interface RequestedDocumentMessagesResponse {
  status: 'success' | 'error';
  data: RequestedDocumentMessage[];
  message?: string;
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  status: 'success' | 'error';
  data: {
    _id: string;
    message: string;
    sent_by: string;
    sent_at: string;
    review_id: string;
  };
  message?: string;
}

export interface DeleteMessageRequest {
  messageId: string;
}

export interface DeleteMessageResponse {
  status: 'success' | 'error';
  message?: string;
}

/**
 * Fetch messages for a specific requested document review
 */
export async function getRequestedDocumentMessages(
  documentId: string,
  reviewId: string
): Promise<RequestedDocumentMessagesResponse> {
  return fetcher<RequestedDocumentMessagesResponse>(
    `/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`
  );
}

/**
 * Send a message for a specific requested document review
 */
export async function sendRequestedDocumentMessage(
  documentId: string,
  reviewId: string,
  data: SendMessageRequest
): Promise<SendMessageResponse> {
  return fetcher<SendMessageResponse>(
    `/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a message from a specific requested document review
 */
export async function deleteRequestedDocumentMessage(
  documentId: string,
  reviewId: string,
  data: DeleteMessageRequest
): Promise<DeleteMessageResponse> {
  return fetcher<DeleteMessageResponse>(
    `/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
}
