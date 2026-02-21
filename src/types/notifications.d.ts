export type NotificationSource =
  | "document_review"
  | "requested_reviews"
  | "quality_check"
  | "requested_checklist"
  | "general";

export type NotificationCategory =
  | "general"
  | "messages"
  | "documents"
  | "applications"
  | "system"
  | "admin message"
  | "document";

export interface Notification {
  _id: string;
  user: string;
  title: string | null;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: NotificationCategory;
  source: NotificationSource;
  link: string | null;
  leadId?: string | null;
  documentId?: string | null;
  documentName?: string | null;
  isRead: boolean;
  createdAt: string;
  applicationType?: string | null;
}

export interface NotificationCreateRequest {
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: NotificationCategory;
  link?: string;
  leadId?: string;
}

export interface NotificationUpdateRequest {
  notificationId: string;
  isRead: boolean;
}

export interface NotificationDeleteRequest {
  notificationId: string;
}

export interface NotificationApiResponse<T> {
  status: "success" | "fail";
  data?: T;
  message?: string;
}

export interface NotificationConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastEvent: string | null;
}

// Socket.IO event types
export interface NotificationNewEvent {
  _id: string;
  title: string | null;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: NotificationCategory;
  source: NotificationSource;
  link: string | null;
  leadId?: string | null;
  documentId?: string | null;
  documentName?: string | null;
  isRead: boolean;
  createdAt: string;
  applicationType?: string | null;
}

export interface NotificationUpdatedEvent {
  _id: string;
  isRead: boolean;
}

export interface NotificationDeletedEvent {
  _id: string;
}
