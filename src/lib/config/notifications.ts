import { API_BASE_URL } from './api';

// Production API base URL for notifications
export const NOTIFICATION_API_BASE_URL = API_BASE_URL;

// API endpoints
export const NOTIFICATION_ENDPOINTS = {
  // REST API endpoints
  LIST: '/api/zoho_dms/users/notifications',
  CREATE: '/api/zoho_dms/users/notifications',
  UPDATE_READ_STATUS: '/api/zoho_dms/users/notifications/read',
  DELETE: '/api/zoho_dms/users/notifications',
  
  // WebSocket configuration
  SOCKET_PATH: '/socket.io',
} as const;

// WebSocket event types
export const SOCKET_EVENTS = {
  NEW: 'notification:new',
  UPDATED: 'notification:updated',
  DELETED: 'notification:deleted',
} as const;

// Connection configuration
export const CONNECTION_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  INITIAL_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  CONNECTION_TIMEOUT: 10000,
  TRANSPORTS: ['websocket', 'polling'] as const,
} as const;

// Performance monitoring
export const MONITORING_CONFIG = {
  METRICS_LOG_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_NOTIFICATIONS_CACHE: 100,
} as const;

// Environment-specific settings
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Feature flags
export const FEATURES = {
  DESKTOP_NOTIFICATIONS: true,
  SOUND_NOTIFICATIONS: true,
  CONNECTION_MONITORING: true,
  PERFORMANCE_METRICS: isDevelopment,
} as const;
