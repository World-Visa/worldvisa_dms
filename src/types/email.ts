export interface EmailAttachment {
  filename: string;
  content_type?: string;
  size: number;
  storage_key: string;
  url: string | null;
}

export interface EmailThread {
  _id: string;
  thread_id: string | null;
  direction: "inbound" | "outbound";
  from: string;
  to: string[];
  subject: string;
  last_event: string;
  client_id: string | null;
  received_at: string | null;
  created_at: string;
  attachments: EmailAttachment[];
  messageCount: number;
  is_read: boolean;
}

export interface EmailMessage {
  _id: string;
  direction: "inbound" | "outbound";
  from: string;
  to?: string[];
  subject: string;
  html?: string;
  text?: string;
  message_id: string;
  thread_id: string | null;
  last_event: string;
  received_at: string | null;
  created_at: string;
  attachments: EmailAttachment[];
}

export interface EmailListResponse {
  data: EmailThread[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  unreadTotal?: number;
}

export interface EmailThreadResponse {
  data: EmailMessage[];
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  in_reply_to?: string;
  cc?: string;
  bcc?: string;
  client_id?: string;
  attachments?: File[];
}
