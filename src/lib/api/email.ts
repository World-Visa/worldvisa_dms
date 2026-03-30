import { fetcher } from "@/lib/fetcher";
import { getClerkToken } from "@/lib/getToken";
import { API_BASE_URL } from "@/lib/config/api";
import type {
  EmailListResponse,
  EmailThreadResponse,
  EmailMessage,
  SendEmailPayload,
} from "@/types/email";

const BASE = `${API_BASE_URL}/api/email`;

export async function getEmailList(params: {
  direction?: "inbound" | "outbound";
  filter?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<EmailListResponse> {
  const query = new URLSearchParams();
  if (params.direction) query.set("direction", params.direction);
  if (params.filter) query.set("filter", params.filter);
  if (params.q) query.set("q", params.q);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return fetcher<EmailListResponse>(`${BASE}/${qs ? `?${qs}` : ""}`);
}

export async function getEmailThread(threadId: string): Promise<EmailThreadResponse> {
  return fetcher<EmailThreadResponse>(`${BASE}/threads/${threadId}`);
}

export async function getSingleEmail(id: string): Promise<EmailMessage> {
  return fetcher<EmailMessage>(`${BASE}/${id}`);
}

export async function markEmailRead(id: string): Promise<void> {
  const token = await getClerkToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/${id}/read`, { method: "PATCH", headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}

export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  const token = await getClerkToken();

  const form = new FormData();
  form.append("to", payload.to);
  form.append("subject", payload.subject);
  if (payload.html) form.append("html", payload.html);
  if (payload.text) form.append("text", payload.text);
  if (payload.in_reply_to) form.append("in_reply_to", payload.in_reply_to);
  if (payload.cc) form.append("cc", payload.cc);
  if (payload.bcc) form.append("bcc", payload.bcc);
  if (payload.client_id) form.append("client_id", payload.client_id);
  if (payload.attachments?.length) {
    for (const file of payload.attachments) {
      form.append("attachments", file, file.name);
    }
  }

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/send`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}
