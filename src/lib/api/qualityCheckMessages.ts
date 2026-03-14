import { fetcher } from "@/lib/fetcher";
import { ZOHO_BASE_URL } from "@/lib/config/api";

const QC_BASE = `${ZOHO_BASE_URL}/visa_applications/quality_check`;

export interface QualityCheckMessage {
  _id: string;
  username: string;
  message: string;
  added_at: string;
}

export interface QualityCheckMessagesResponse {
  success: boolean;
  data: QualityCheckMessage[];
}

export interface AddMessageResponse {
  success: boolean;
  data: QualityCheckMessage;
}

export interface EditMessageResponse {
  success: boolean;
  data: QualityCheckMessage;
}

export interface DeleteMessageResponse {
  success: boolean;
  message?: string;
}

export async function getQualityCheckMessages(
  qcId: string,
): Promise<QualityCheckMessagesResponse> {
  return fetcher<QualityCheckMessagesResponse>(
    `${QC_BASE}/${qcId}/messages`,
  );
}

export async function addQualityCheckMessage(
  qcId: string,
  data: { message: string },
): Promise<AddMessageResponse> {
  return fetcher<AddMessageResponse>(`${QC_BASE}/${qcId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function editQualityCheckMessage(
  qcId: string,
  data: { messageId: string; message: string },
): Promise<EditMessageResponse> {
  return fetcher<EditMessageResponse>(`${QC_BASE}/${qcId}/messages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteQualityCheckMessage(
  qcId: string,
  data: { messageId: string },
): Promise<DeleteMessageResponse> {
  return fetcher<DeleteMessageResponse>(`${QC_BASE}/${qcId}/messages`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
