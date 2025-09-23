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

  // Track processed notifications to prevent duplicates
  private processedNotifications = new Set<string>();
  
  // Throttle notification:all events to reduce spam
  private lastNotificationAllTime = 0;
  private notificationAllThrottleMs = 2000; // Only process once every 2 seconds

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
    
    console.log('🔔 Attempting to connect to:', baseUrl);
    console.log('🔔 Socket path:', NOTIFICATION_ENDPOINTS.SOCKET_PATH);
    console.log('🔔 Auth token available:', !!token);
    
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

  // Force re-subscription of all listeners (useful for debugging)
  forceResubscribe(): void {
    if (this.socket && this.socket.connected) {
      console.log('🔔 Force re-subscribing to', this.listeners.size, 'event types');
      this.listeners.forEach((callbacks, event) => {
        console.log(`🔔 Force setting up ${callbacks.size} listeners for event: ${event}`);
        callbacks.forEach(callback => {
          this.socket!.on(event, callback);
        });
      });
    } else {
      console.log('🔔 Cannot force re-subscribe: socket not connected');
    }
  }

  // Manually trigger a test notification event (for debugging)
  triggerTestNotification(): void {
    if (this.socket && this.socket.connected) {
      const testNotification = {
        _id: `test_${Date.now()}`,
        message: 'Manual test notification',
        type: 'info',
        category: 'general',
        link: null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      
      // Manually call all registered listeners
      const callbacks = this.listeners.get('notification:new');
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback(testNotification);
          } catch (error) {
            console.error('🔔 Error in notification callback:', error);
          }
        });
      } else {
        console.log('🔔 Manual trigger: No callbacks found for notification:new');
        console.log('🔔 Manual trigger: Available callbacks:', this.listeners);
      }
    } else {
      console.log('🔔 Cannot trigger test notification: socket not connected');
    }
  }

  // Enhanced connection utilities
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Check if a notification is new (not already processed)
  private isNewNotification(notification: any): boolean {
    if (!notification || !notification._id) {
      return false;
    }

    const notificationId = notification._id;
    
    if (this.processedNotifications.has(notificationId)) {
      return false;
    }

    // Mark as processed
    this.processedNotifications.add(notificationId);
    
    // Clean up old processed notifications (keep only last 100)
    if (this.processedNotifications.size > 100) {
      const notificationsArray = Array.from(this.processedNotifications);
      const toRemove = notificationsArray.slice(0, notificationsArray.length - 100);
      toRemove.forEach(id => this.processedNotifications.delete(id));
    }

    return true;
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
    console.log(`🔔 subscribe: Registering listener for event: ${event}`);
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    console.log(`🔔 subscribe: Total listeners for ${event}:`, this.listeners.get(event)!.size);
    
    // Set up socket listener if connected
    if (this.socket && this.socket.connected) {
      this.socket.on(event, callback);
      console.log(`🔔 subscribe: Socket listener set up for ${event}`);
    } else {
      console.log(`🔔 subscribe: Socket not connected, listener will be set up on connection`);
    }

    return () => {
      console.log(`🔔 subscribe: Unsubscribing from event: ${event}`);
      console.log(`🔔 subscribe: Listeners before unsubscribe:`, this.listeners.get(event)?.size || 0);
      this.listeners.get(event)?.delete(callback);
      console.log(`🔔 subscribe: Listeners after unsubscribe:`, this.listeners.get(event)?.size || 0);
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
      console.log('🔔 Socket connected successfully!');
      console.log('🔔 Socket ID:', this.socket?.id);
      
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
      console.log('🔔 Re-subscribing to', this.listeners.size, 'event types');
      this.listeners.forEach((callbacks, event) => {
        console.log(`🔔 Setting up ${callbacks.size} listeners for event: ${event}`);
        callbacks.forEach(callback => {
          this.socket!.on(event, callback);
        });
      });

      // Force a small delay to ensure all hooks have registered their listeners
      setTimeout(() => {
        console.log('🔔 Final listener count:', this.listeners.size, 'event types');
        this.listeners.forEach((callbacks, event) => {
          console.log(`🔔 Final count for ${event}: ${callbacks.size} listeners`);
        });
      }, 100);
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
    this.socket.on('notification:new', (data: any) => {
      console.log('🔔 Received notification:new event:', data);
      console.log('🔔 Data type:', typeof data);
      console.log('🔔 Data keys:', Object.keys(data || {}));
      this.metrics.messagesReceived++;
      this.updateConnectionState({ 
        lastEvent: 'notification:new' 
      });
    });
    
    this.socket.on('notification:updated', (data: any) => {
      console.log('🔔 Received notification:updated event:', data);
      this.metrics.messagesReceived++;
      this.updateConnectionState({ 
        lastEvent: 'notification:updated' 
      });
    });
    
    this.socket.on('notification:deleted', (data: any) => {
      console.log('🔔 Received notification:deleted event:', data);
      this.metrics.messagesReceived++;
      this.updateConnectionState({ 
        lastEvent: 'notification:deleted' 
      });
    });

    // Add listeners for common events to debug
    this.socket.on('message', (data: any) => {
      console.log('🔔 Received message event:', data);
    });
    
    this.socket.on('notification', (data: any) => {
      console.log('🔔 Received notification event:', data);
    });

    // Handle notification:all events (server is sending this instead of notification:new)
    this.socket.on('notification:all', (data: any) => {
      const now = Date.now();
      
      // Throttle notification:all events to reduce spam
      if (now - this.lastNotificationAllTime < this.notificationAllThrottleMs) {
        console.log('🔔 notification:all event throttled (too frequent), skipping');
        return;
      }
      this.lastNotificationAllTime = now;
      
      console.log('🔔 Received notification:all event:', data);
      
      // Check if data is empty or invalid
      if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
        console.log('🔔 notification:all event has no notifications, skipping');
        return;
      }
      
      // Process the notification:all event as if it were notification:new
      // Get the latest notification (first in array)
      const latestNotification = data.data[0];
      if (latestNotification) {
        console.log('🔔 Processing latest notification from notification:all:', latestNotification);
        
        // Check if this is a truly new notification (not a duplicate)
        const isNewNotification = this.isNewNotification(latestNotification);
        if (isNewNotification) {
          console.log('🔔 This is a new notification, triggering listeners');
          // Manually trigger the notification:new listeners
          const callbacks = this.listeners.get('notification:new');
          if (callbacks) {
            callbacks.forEach(callback => {
              try {
                callback(latestNotification);
              } catch (error) {
                console.error('🔔 Error in notification:all callback:', error);
              }
            });
          }
        } else {
          console.log('🔔 This is a duplicate notification, skipping');
        }
      }
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
          console.log('🔔 Notification socket metrics:', metrics);
        }, MONITORING_CONFIG.METRICS_LOG_INTERVAL);
      }
    }
  }
}

// Singleton instance
export const notificationSocket = new NotificationSocketManager();