export interface Notification {
    _id: string;
    user: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'general' | 'messages' | 'documents' | 'applications' | 'system';
    link: string | null;
    isRead: boolean;
    createdAt: string;
  }
  
  export interface NotificationCreateRequest {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'general' | 'messages' | 'documents' | 'applications' | 'system';
    link?: string;
  }
  
  export interface NotificationUpdateRequest {
    notificationId: string;
    isRead: boolean;
  }
  
  export interface NotificationDeleteRequest {
    notificationId: string;
  }
  
  export interface NotificationApiResponse<T> {
    status: 'success' | 'fail';
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
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'general' | 'messages' | 'documents' | 'applications' | 'system';
    link: string | null;
    isRead: boolean;
    createdAt: string;
  }
  
  export interface NotificationUpdatedEvent {
    _id: string;
    isRead: boolean;
  }
  
  export interface NotificationDeletedEvent {
    _id: string;
  }