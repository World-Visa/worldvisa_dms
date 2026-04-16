export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://backend.worldvisa-api.cloud"
    : "http://localhost:3000");

export const ZOHO_BASE_URL = "/api/zoho_dms";

export const BACKEND_HOST =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://backend.worldvisa-api.cloud"
    : "http://localhost:3000");

export const BACKEND_ZOHO_URL = `${BACKEND_HOST}/api/zoho_dms`;

export const API_CONFIG = {
  BASE_URL: ZOHO_BASE_URL,

  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },

  ENDPOINTS: {
    // Document review requests
    REVIEW_REQUESTS: (documentId: string) =>
      `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews`,

    REVIEW_REQUESTS_SEND: (documentId: string) =>
      `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews/send`,

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

    // Checklist document templates
    CHECKLIST_DOCUMENT_TEMPLATES: {
      BASE:       `${ZOHO_BASE_URL}/checklist-documents`,
      VISA_TYPES: `${ZOHO_BASE_URL}/checklist-documents/visa-service-types`,
      SUMMARY:    `${ZOHO_BASE_URL}/checklist-documents/summary`,
      GROUPED:    `${ZOHO_BASE_URL}/checklist-documents/grouped`,
      CATEGORIES: `${ZOHO_BASE_URL}/checklist-documents/categories`,
      BY_ID:      (id: string) => `${ZOHO_BASE_URL}/checklist-documents/${id}`,
      STATE:      (id: string) => `${ZOHO_BASE_URL}/checklist-documents/${id}/state`,
      BULK:       `${ZOHO_BASE_URL}/checklist-documents/bulk`,
    },

    // Checklist requests (Admin)
    CHECKLIST_REQUESTS: {
      LIST: `${ZOHO_BASE_URL}/visa_applications/checklist/requested`,
      BY_ID: (leadId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/checklist/requested/${leadId}`,
      STATUS: (leadId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/${leadId}/checklist-status`,
    },

    // Admin approval requests (deadline extension etc.)
    ADMIN_APPROVAL_REQUESTS: {
      BASE:    `${ZOHO_BASE_URL}/visa_applications/admin-approval-requests`,
      BY_LEAD: (leadId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/admin-approval-requests/lead/${leadId}`,
      APPROVE: (id: string) =>
        `${ZOHO_BASE_URL}/visa_applications/admin-approval-requests/${id}/approve`,
      REJECT:  (id: string) =>
        `${ZOHO_BASE_URL}/visa_applications/admin-approval-requests/${id}/reject`,
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

export const API_ENDPOINTS = {
  ANALYTICS: {
    DASHBOARD: (period: number) =>
      `${ZOHO_BASE_URL}/visa_applications/admin/analytics?period=${period}`,
  },
  VISA_APPLICATIONS: {
    LIST: (params?: string) =>
      `${ZOHO_BASE_URL}/visa_applications${params ? `?${params}` : ""}`,
    BY_ID: (id: string) => `${ZOHO_BASE_URL}/visa_applications/${id}`,
    UPDATE_FIELDS: `${ZOHO_BASE_URL}/visa_applications/update_fields`,
    QUALITY_CHECK: `${ZOHO_BASE_URL}/visa_applications/quality_check`,
    DEADLINE_STATS: (params: string) =>
      `${ZOHO_BASE_URL}/visa_applications/deadline-stats?${params}`,
    ACTIVITY: (id: string, params: string) =>
      `${ZOHO_BASE_URL}/visa_applications/${id}/activity?${params}`,
    ACTIVITY_DOWNLOAD: (leadId: string) =>
      `${ZOHO_BASE_URL}/visa_applications/${leadId}/activity/download`,
    NOTES: (id: string) => `${ZOHO_BASE_URL}/visa_applications/${id}/notes`,
    CHECKLIST_STATUS: (leadId: string) =>
      `${ZOHO_BASE_URL}/visa_applications/${leadId}/checklist-status`,
    CHECKLIST_REQUESTED: {
      LIST: `${ZOHO_BASE_URL}/visa_applications/checklist/requested`,
      BY_ID: (leadId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/checklist/requested/${leadId}`,
    },
    DOCUMENTS: {
      BY_APP: (appId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/${appId}/documents`,
      COMMENT: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/comment`,
      STATUS: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/status`,
      TIMELINE: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/timeline`,
      MOVE: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/move`,
      MOVED_ALL: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/move/all`,
      LINKS: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/links`,
      REUPLOAD: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/reupload`,
      REVIEW_REQUESTS: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/requested_reviews`,
      REVIEW_STATUS: (docId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/requested_reviews/status`,
      REVIEW_MESSAGES: (docId: string, reviewId: string) =>
        `${ZOHO_BASE_URL}/visa_applications/documents/${docId}/requested_reviews/${reviewId}/messages`,
      REQUESTED_ALL: `${ZOHO_BASE_URL}/visa_applications/documents/requested_reviews/all`,
      REQUESTED_ALL_TO: `${ZOHO_BASE_URL}/visa_applications/documents/requested_reviews/all_to`,
      REQUESTED_ALL_ME: `${ZOHO_BASE_URL}/visa_applications/documents/requested_reviews/all_me`,
      REQUESTED_SEARCH: `${ZOHO_BASE_URL}/visa_applications/documents/requested_reviews/search`,
    },
    STAGE2_DOCS: (appId: string) =>
      `${ZOHO_BASE_URL}/visa_applications/${appId}/aus-stage2-documents`,
    SAMPLE_DOCS: (appId: string) =>
      `${ZOHO_BASE_URL}/visa_applications/${appId}/sample`,
    SPOUSE: {
      LIST: (params: string) =>
        `${ZOHO_BASE_URL}/visa_applications/spouse/applications?${params}`,
      BY_ID: (id: string) =>
        `${ZOHO_BASE_URL}/visa_applications/spouse/applications/${id}`,
      NOTES: (id: string) =>
        `${ZOHO_BASE_URL}/visa_applications/spouse/applications/${id}/notes`,
    },
  },
  CLIENTS: {
    LIST: (params: string) => `${ZOHO_BASE_URL}/clients/all?${params}`,
    BY_ID: (id: string) => `${ZOHO_BASE_URL}/clients/${id}`,
    DOCUMENTS: (params: string) =>
      `${ZOHO_BASE_URL}/clients/documents?${params}`,
    DOCUMENT_MOVE: (docId: string) =>
      `${ZOHO_BASE_URL}/clients/documents/${docId}/move`,
    APPLICATION: `${ZOHO_BASE_URL}/clients/application`,
    SIGNUP: `${ZOHO_BASE_URL}/clients/signup`,
    ADMIN_CHECK: (leadId: string) =>
      `${ZOHO_BASE_URL}/clients/admin/check/${leadId}`,
    ADMIN_UPDATE: (leadId: string) =>
      `${ZOHO_BASE_URL}/clients/admin/update/${leadId}`,
    CHECKLIST: {
      LIST: `${ZOHO_BASE_URL}/clients/checklist/requested`,
      BY_ID: (leadId: string) =>
        `${ZOHO_BASE_URL}/clients/checklist/requested/${leadId}`,
    },
    PROFILE: {
      BY_ID: (leadId: string) => `${ZOHO_BASE_URL}/clients/profile/${leadId}`,
    },
    INVITE: `${ZOHO_BASE_URL}/clients/invite`,
  },
  MCUBE: {
    OUTBOUND_CALL: `${API_BASE_URL}/api/mcube/calls/outbound`,
  },
  CALL_LOGS: {
    LIST:  (params?: string) => `${API_BASE_URL}/api/mcube/call-logs${params ? `?${params}` : ''}`,
    BY_ID: (callId: string)  => `${API_BASE_URL}/api/mcube/call-logs/${callId}`,
    NOTES: (callId: string)  => `${API_BASE_URL}/api/mcube/call-logs/${callId}/notes`,
  },
  USERS: {
    ALL: (params: string) => `${ZOHO_BASE_URL}/users/all?${params}`,
    BY_ID: (id: string) => `${ZOHO_BASE_URL}/users/${id}`,
    CREATE: `${ZOHO_BASE_URL}/users/signup`, // Deprecated
    UPDATE_ROLE: `${ZOHO_BASE_URL}/users/update_role`,
    INVITE: `${ZOHO_BASE_URL}/users/invite`,
    REMOVE: `${ZOHO_BASE_URL}/users/remove`, // Soft delete
    RESET_PASSWORD: `${ZOHO_BASE_URL}/users/reset`, // Deprecated
    CLIENT_RESET_PASSWORD: `${ZOHO_BASE_URL}/users/clients/reset-password`, // Deprecated
    PROFILE_IMAGE: `${ZOHO_BASE_URL}/users/profile-image`,
    CHECK_AVAILABILITY: "/api/users/check-availability",
  },
} as const;
