const getEnvVar = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

// Base URLs from environment
export const API_BASE_URL = getEnvVar(
  "NEXT_PUBLIC_API_BASE_URL",
  "https://backend.worldvisa-api.cloud",
);

export const ZOHO_BASE_URL = getEnvVar(
  "NEXT_PUBLIC_ZOHO_BASE_URL",
  "https://backend.worldvisa-api.cloud/api/zoho_dms",
);

// Keep existing API_CONFIG for backward compatibility
export const API_CONFIG = {
  BASE_URL: ZOHO_BASE_URL,

  ENDPOINTS: {
    // Document review requests
    REVIEW_REQUESTS: (documentId: string) =>
      `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews`,

    REVIEW_REQUEST_MESSAGES: (documentId: string, reviewId: string) =>
      `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`,

    // Requested documents
    REQUESTED_DOCUMENTS: {
      ALL: `${ZOHO_BASE_URL}/visa_applications/documents/requested_reviews/all`,
      ALL_TO: `${ZOHO_BASE_URL}/visa_applications/documents/requested_reviews/all_to`,
      ALL_ME: `${ZOHO_BASE_URL}/visa_applications/documents/requested_reviews/all_me`,
      SEARCH: `${ZOHO_BASE_URL}/visa_applications/documents/requested_reviews/search`,
    },

    // Quality check
    QUALITY_CHECK: `${ZOHO_BASE_URL}/visa_applications/quality_check`,

    // Checklist requests (Admin)
    CHECKLIST_REQUESTS: {
      LIST: `${ZOHO_BASE_URL}/visa_applications/checklist/requested`,
      BY_ID: (leadId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/checklist/requested/${leadId}`,
      STATUS: (leadId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/${leadId}/checklist-status`,
    },

    // Client checklist requests
    CLIENT_CHECKLIST_REQUESTS: {
      LIST: `${ZOHO_BASE_URL}/clients/checklist/requested`,
      BY_ID: (leadId: string) =>
        `${ZOHO_BASE_URL}/clients/checklist/requested/${leadId}`,
      STATUS: (leadId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/${leadId}/checklist-status`,
    },

    // User management
    USERS: {
      LIST: `${ZOHO_BASE_URL}/users`,
      CREATE: `${ZOHO_BASE_URL}/users/signup`,
      UPDATE_ROLE: `${ZOHO_BASE_URL}/users/update_role`,
      RESET_PASSWORD: `${ZOHO_BASE_URL}/users/reset`,
    },

    // Authentication
    AUTH: {
      LOGIN: `${ZOHO_BASE_URL}/auth/login`,
      REFRESH: `${ZOHO_BASE_URL}/auth/refresh`,
    },
  },

  // Timeout configuration
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    UPLOAD: 60000, // 60 seconds for file uploads
    LONG_RUNNING: 120000, // 2 minutes for long-running operations
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second base delay
    MAX_DELAY: 30000, // 30 seconds max delay
  },
} as const;

/**
 * Get headers for JSON requests
 */
export function getJsonHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Get headers for FormData requests (file uploads)
 * IMPORTANT: Do NOT set Content-Type - browser sets it automatically with boundary
 */
export function getFormDataHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

export function getFullUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return endpoint;

  const queryString = buildQueryString(params);
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}
