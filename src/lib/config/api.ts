/**
 * Centralized API configuration for the application
 * This makes it easy to switch between environments and maintain consistency
 */

// Define the base URL separately to avoid circular reference
const BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export const API_CONFIG = {
  BASE_URL,
  
  ENDPOINTS: {
    // Document review requests
    REVIEW_REQUESTS: (documentId: string) => 
      `${BASE_URL}/visa_applications/documents/${documentId}/requested_reviews`,
    
    REVIEW_REQUEST_MESSAGES: (documentId: string, reviewId: string) =>
      `${BASE_URL}/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`,
    
    // Requested documents
    REQUESTED_DOCUMENTS: {
      ALL: `${BASE_URL}/visa_applications/documents/requested_reviews/all`,
      ALL_TO: `${BASE_URL}/visa_applications/documents/requested_reviews/all_to`,
      ALL_ME: `${BASE_URL}/visa_applications/documents/requested_reviews/all_me`,
      SEARCH: `${BASE_URL}/visa_applications/documents/requested_reviews/search`,
    },
    
    // Quality check
    QUALITY_CHECK: `${BASE_URL}/visa_applications/quality_check`,
    
    // Checklist requests (Admin)
    CHECKLIST_REQUESTS: {
      LIST: `${BASE_URL}/visa_applications/checklist/requested`,
      BY_ID: (leadId: string) => `${BASE_URL}/visa_applications/checklist/requested/${leadId}`,
      STATUS: (leadId: string) => `${BASE_URL}/visa_applications/${leadId}/checklist-status`,
    },
    
    // Client checklist requests
    CLIENT_CHECKLIST_REQUESTS: {
      LIST: `${BASE_URL}/clients/checklist/requested`,
      BY_ID: (leadId: string) => `${BASE_URL}/clients/checklist/requested/${leadId}`,
      STATUS: (leadId: string) => `${BASE_URL}/visa_applications/${leadId}/checklist-status`,
    },
    
    // User management
    USERS: {
      LIST: `${BASE_URL}/users`,
      CREATE: `${BASE_URL}/users/signup`,
      UPDATE_ROLE: `${BASE_URL}/users/update_role`,
      RESET_PASSWORD: `${BASE_URL}/users/reset`,
    },
    
    // Authentication
    AUTH: {
      LOGIN: `${BASE_URL}/auth/login`,
      REFRESH: `${BASE_URL}/auth/refresh`,
    }
  },
  
  // Request configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Timeout configuration
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    UPLOAD: 60000,  // 60 seconds for file uploads
    LONG_RUNNING: 120000, // 2 minutes for long-running operations
  },
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second base delay
    MAX_DELAY: 30000, // 30 seconds max delay
  }
} as const;

/**
 * Helper function to build query strings
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

/**
 * Helper function to get full URL with query parameters
 */
export function getFullUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return endpoint;
  
  const queryString = buildQueryString(params);
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}
