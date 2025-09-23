/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error
import { io, type Socket } from 'socket.io-client';
import { tokenStorage } from './auth';
import { 
  NOTIFICATION_API_BASE_URL, 
  NOTIFICATION_ENDPOINTS, 
  SOCKET_EVENTS, 
  CONNECTION_CONFIG,
  MONITORING_CONFIG 
} from '@/lib/config/notifications';
import { 
  NotificationNewEvent, 
  NotificationUpdatedEvent, 
  NotificationDeletedEvent,
  NotificationConnectionState 
} from '@/types/notifications';

// Enhanced event listener types for better type safety
type EventCallback<T = any> = (data: T) => void;
type EventMap = {
  'notification:new': EventCallback<NotificationNewEvent>;
  'notification:updated': EventCallback<NotificationUpdatedEvent>;
  'notification:deleted': EventCallback<NotificationDeletedEvent>;
};

export class NotificationSocketManager {
  private socket: typeof Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = CONNECTION_CONFIG.MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = CONNECTION_CONFIG.INITIAL_RECONNECT_DELAY;
  private maxReconnectDelay = CONNECTION_CONFIG.MAX_RECONNECT_DELAY;
  private isConnecting = false;
  private isDestroyed = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  // Enhanced listener management with proper typing
  private listeners = new Map<keyof EventMap, Set<EventCallback>>();
  private connectionState: NotificationConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null
  };
  private stateListeners = new Set<(state: NotificationConnectionState) => void>();

  // Performance monitoring
  private metrics = {
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    messagesReceived: 0,
    lastConnectionTime: null as Date | null,
    averageReconnectTime: 0,
  };

  constructor() {
    this.setupVisibilityHandling();
    this.setupPerformanceMonitoring();
  }

  // Connection management with enhanced error handling
  connect(): void {
    if (this.isConnecting || this.isConnected() || this.isDestroyed) {
      return;
    }
    
    const token = tokenStorage.get();
    if (!token) {
      console.error('🔔 No authentication token available for socket connection');
      this.handleConnectionError('No authentication token available');
      return;
    }

    this.isConnecting = true;
    this.metrics.connectionAttempts++;
    this.updateConnectionState({ isConnecting: true, error: null });

    // Use production API URL for WebSocket connection
    const baseUrl = NOTIFICATION_API_BASE_URL;
    
    try {
      this.socket = io(baseUrl, {
        path: NOTIFICATION_ENDPOINTS.SOCKET_PATH,
        auth: { token },
        transports: CONNECTION_CONFIG.TRANSPORTS,
        reconnection: false, // We handle reconnection manually for better control
        timeout: CONNECTION_CONFIG.CONNECTION_TIMEOUT,
        forceNew: true, // Force new connection
      });


      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.isConnecting && !this.isConnected()) {
          this.handleConnectionError('Connection timeout');
        }
      }, CONNECTION_CONFIG.CONNECTION_TIMEOUT);

      this.setupEventListeners();
    } catch (error) {
      console.error('🔔 Failed to create socket:', error);
      this.handleConnectionError(`Failed to create socket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced event subscription system with better typing
  onNotificationNew(callback: EventCallback<NotificationNewEvent>): () => void {
    return this.subscribe(SOCKET_EVENTS.NEW, callback);
  }

  onNotificationUpdated(callback: EventCallback<NotificationUpdatedEvent>): () => void {
    return this.subscribe(SOCKET_EVENTS.UPDATED, callback);
  }

  onNotificationDeleted(callback: EventCallback<NotificationDeletedEvent>): () => void {
    return this.subscribe(SOCKET_EVENTS.DELETED, callback);
  }

  onConnectionStateChange(callback: (state: NotificationConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    // Immediate callback with current state
    callback(this.connectionState);
    
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  // Get connection metrics for monitoring
  getMetrics() {
    return { ...this.metrics };
  }

  // Enhanced connection utilities
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect(): void {
    this.cleanup();
    this.updateConnectionState({ 
      isConnected: false, 
      isConnecting: false, 
      error: null 
    });
  }

  // Complete cleanup and destroy
  destroy(): void {
    this.isDestroyed = true;
    this.cleanup();
    this.listeners.clear();
    this.stateListeners.clear();
  }

  private cleanup(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Enhanced private methods with better type safety
  private subscribe(event: keyof EventMap, callback: EventCallback): () => void {
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    // Set up socket listener if connected
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
    }

    return () => {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  private setupEventListeners(): void {
    if (!this.socket) {
      return;
    }


    this.socket.on('connect', () => {
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.reconnectAttempts = 0;
      this.reconnectDelay = CONNECTION_CONFIG.INITIAL_RECONNECT_DELAY;
      this.isConnecting = false;
      this.metrics.successfulConnections++;
      this.metrics.lastConnectionTime = new Date();
      
      this.updateConnectionState({ 
        isConnected: true, 
        isConnecting: false, 
        error: null,
        lastEvent: 'connected'
      });

      // Re-subscribe to all events
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket!.on(event, callback);
        });
      });

    });

    this.socket.on('connect_error', (error: any) => {
      console.error('🔔 Socket connection error:', error);
      this.metrics.failedConnections++;
      this.handleConnectionError(error.message || 'Connection failed');
    });

    this.socket.on('disconnect', (reason: any) => {
      this.updateConnectionState({ 
        isConnected: false, 
        isConnecting: false, 
        error: reason,
        lastEvent: 'disconnected'
      });
      
      // Attempt reconnection if not manually disconnected
      if (reason !== 'io client disconnect' && !this.isDestroyed) {
        this.scheduleReconnect();
      }
    });

    // Handle message events for metrics
    this.socket.on('notification:new', () => {
      this.metrics.messagesReceived++;
      this.updateConnectionState({ 
        lastEvent: 'notification:new' 
      });
    });
    
    this.socket.on('notification:updated', () => {
      this.metrics.messagesReceived++;
      this.updateConnectionState({ 
        lastEvent: 'notification:updated' 
      });
    });
    
    this.socket.on('notification:deleted', () => {
      this.metrics.messagesReceived++;
      this.updateConnectionState({ 
        lastEvent: 'notification:deleted' 
      });
    });
  }

  private handleConnectionError(error: string): void {
    this.isConnecting = false;
    this.reconnectAttempts++;
    
    console.warn(`🔔 Notification socket error (attempt ${this.reconnectAttempts}):`, error);
    
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isDestroyed) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔔 Notification socket: Max reconnection attempts reached');
    }
    
    this.updateConnectionState({ 
      isConnected: false, 
      isConnecting: false, 
      error 
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout || this.isDestroyed) return;

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + jitter,
      this.maxReconnectDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (!this.isDestroyed) {
        this.connect();
      }
    }, delay);

  }

  private updateConnectionState(updates: Partial<NotificationConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.stateListeners.forEach(callback => callback(this.connectionState));
  }

  private setupVisibilityHandling(): void {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected() && !this.isDestroyed) {
          this.connect();
        }
      });

      // Handle online/offline events
      window.addEventListener('online', () => {
        if (!this.isConnected() && !this.isDestroyed) {
          this.connect();
        }
      });

      window.addEventListener('offline', () => {
        this.updateConnectionState({ 
          isConnected: false, 
          isConnecting: false, 
          error: 'Network offline' 
        });
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Log metrics every 5 minutes in development
      if (process.env.NODE_ENV === 'development') {
        setInterval(() => {
          const metrics = this.getMetrics();
        }, MONITORING_CONFIG.METRICS_LOG_INTERVAL);
      }
    }
  }
}

// Singleton instance
export const notificationSocket = new NotificationSocketManager();