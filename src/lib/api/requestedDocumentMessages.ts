import { fetcher } from '@/lib/fetcher';

export interface RequestedDocumentMessage {
  _id: string;
  message: string;
  username: string;
  added_at: string;
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
    username: string;
    added_at: string;
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
  // Use production server directly like Postman does
  return fetcher<RequestedDocumentMessagesResponse>(
    `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`
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
    `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`,
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
  // Use production server directly like Postman does
  return fetcher<DeleteMessageResponse>(
    `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
}
