/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommentEvent, RealtimeConnectionState } from '@/types/comments';
import { tokenStorage } from './auth';
import * as Sentry from '@sentry/nextjs';

export interface RequestedDocumentEvent {
  type: 'requested_document_deleted' | 'requested_document_updated' | 'requested_document_created';
  document_id: string;
  document?: any;
  requested_by?: string;
  requested_to?: string;
}

export class RealtimeManager {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private isConnecting = false;
  private listeners = new Map<string, Set<(event: CommentEvent | RequestedDocumentEvent) => void>>();
  private connectionState: RealtimeConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null
  };
  private stateListeners = new Set<(state: RealtimeConnectionState) => void>();

  constructor() {
    // Auto-reconnect on page visibility change
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          this.reconnect();
        }
      });
    }
  }

  // Subscribe to events for a specific document or general events
  subscribe(subscriptionKey: string, callback: (event: CommentEvent | RequestedDocumentEvent) => void): () => void {
    if (!this.listeners.has(subscriptionKey)) {
      this.listeners.set(subscriptionKey, new Set());
    }
    
    this.listeners.get(subscriptionKey)!.add(callback);
    
    // Connect if not already connected
    if (!this.isConnected() && !this.isConnecting) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      const documentListeners = this.listeners.get(subscriptionKey);
      if (documentListeners) {
        documentListeners.delete(callback);
        if (documentListeners.size === 0) {
          this.listeners.delete(subscriptionKey);
        }
      }
      
      // Disconnect if no more listeners
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  // Subscribe to connection state changes
  onStateChange(callback: (state: RealtimeConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  private connect(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;
    this.updateConnectionState({ isConnecting: true, error: null });

    const token = tokenStorage.get();
    if (!token) {
      this.handleConnectionError('No authentication token available');
      return;
    }

    try {
      // Get user role from localStorage to include in the URL
      let roleParam = '';
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.role) {
              roleParam = `&role=${encodeURIComponent(user.role)}`;
            }
          } catch (error) {
            console.warn('Failed to parse user data for SSE:', error);
          }
        }
      }

      // Create SSE connection to our API endpoint
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const eventSource = new EventSource(
        `${baseUrl}/api/realtime/comments?token=${encodeURIComponent(token)}${roleParam}`,
        {
          withCredentials: true
        }
      );

      this.eventSource = eventSource;

      eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
        this.updateConnectionState({ 
          isConnected: true, 
          isConnecting: false, 
          error: null 
        });
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data);
          
          // Check if it's a comment event or requested document event
          if (eventData.type && eventData.type.startsWith('comment_')) {
            const commentEvent: CommentEvent = eventData;
            this.handleCommentEvent(commentEvent);
          } else if (eventData.type && eventData.type.startsWith('requested_document_')) {
            const requestedDocumentEvent: RequestedDocumentEvent = eventData;
            this.handleRequestedDocumentEvent(requestedDocumentEvent);
          }
          
          this.updateConnectionState({ 
            lastEvent: new Date().toISOString() 
          });
        } catch (error) {
          console.error('Failed to parse real-time event:', error);
          Sentry.captureException(error, {
            tags: { operation: 'parse_realtime_event' },
            extra: { eventData: event.data }
          });
        }
      };

      eventSource.onerror = (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Realtime connection error:', error);
        }
        this.handleConnectionError('Connection error occurred');
      };

    } catch (error) {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to create realtime connection:', error);
      }
      this.handleConnectionError('Failed to establish connection');
    }
  }

  private handleCommentEvent(event: CommentEvent): void {
    // Notify all listeners for this document
    const documentListeners = this.listeners.get(event.document_id);
    if (documentListeners) {
      documentListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in comment event callback:', error);
          Sentry.captureException(error, {
            tags: { operation: 'comment_event_callback' },
            extra: { event }
          });
        }
      });
    }
  }

  private handleRequestedDocumentEvent(event: RequestedDocumentEvent): void {
    // Notify all listeners for requested documents
    const requestedDocumentListeners = this.listeners.get('requested-documents');
    if (requestedDocumentListeners) {
      requestedDocumentListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in requested document event callback:', error);
          Sentry.captureException(error, {
            tags: { operation: 'requested_document_event_callback' },
            extra: { event }
          });
        }
      });
    }

    // Also notify listeners for the specific document if it exists
    const documentListeners = this.listeners.get(event.document_id);
    if (documentListeners) {
      documentListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in document-specific requested document event callback:', error);
          Sentry.captureException(error, {
            tags: { operation: 'document_specific_requested_document_event_callback' },
            extra: { event }
          });
        }
      });
    }
  }

  private handleConnectionError(error: string): void {
    this.isConnecting = false;
    this.updateConnectionState({ 
      isConnected: false, 
      isConnecting: false, 
      error 
    });

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Attempt reconnection with exponential backoff
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        this.maxReconnectDelay
      );
      
      setTimeout(() => {
        if (this.listeners.size > 0) {
          this.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      Sentry.captureMessage('Realtime connection failed after max attempts', {
        level: 'error',
        tags: { operation: 'realtime_connection_failed' }
      });
    }
  }

  private reconnect(): void {
    if (this.isConnected() || this.isConnecting) {
      return;
    }
    
    this.reconnectAttempts = 0;
    this.connect();
  }

  private disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnecting = false;
    this.updateConnectionState({ 
      isConnected: false, 
      isConnecting: false, 
      error: null 
    });
  }

  private updateConnectionState(updates: Partial<RealtimeConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.stateListeners.forEach(callback => {
      try {
        callback(this.connectionState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  getConnectionState(): RealtimeConnectionState {
    return { ...this.connectionState };
  }

  // Cleanup method
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
    this.stateListeners.clear();
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeManager.destroy();
  });
}
