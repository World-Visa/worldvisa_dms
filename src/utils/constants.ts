// User roles
export const USER_ROLES = {
  ADMIN: "admin",
  CLIENT: "client",
} as const;

// Application statuses
export const APPLICATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
} as const;

// Document statuses
export const DOCUMENT_STATUS = {
  PENDING: "pending",
  UPLOADED: "uploaded",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  ADMIN_LOGIN: "/api/auth/admin",
  CLIENT_LOGIN: "/api/auth/client",
  LOGOUT: "/api/auth/logout",
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_PREFERENCES: "user_preferences",
  THEME: "theme",
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  API: "yyyy-MM-dd",
  DATETIME: "MMM dd, yyyy HH:mm",
} as const;
