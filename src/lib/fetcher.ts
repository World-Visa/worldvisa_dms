import { useAuth } from '@/hooks/useAuth';

// Extend RequestInit to include Next.js specific options
// Note: cacheLife and cacheTag are now handled via "use cache" directive and cacheTag() function
// revalidate is still supported for backward compatibility
interface NextFetchOptions {
  next?: {
    revalidate?: number;
  };
}

// Generic fetch wrapper with automatic session cookie and CSRF token
export async function fetcher<T>(
  url: string,
  options: RequestInit & NextFetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add CSRF token for state-changing requests (POST/PUT/DELETE/PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
    const csrfToken = useAuth.getState().csrfToken;
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }



  // Extract next config if provided (for server-side caching)
  const { next, ...fetchOptions } = options;

  // Merge headers and other options
  const finalOptions: RequestInit & NextFetchOptions = {
    ...fetchOptions,
    headers,
    credentials: 'include',  // CRITICAL: Send session cookies with every request
  };

  // Only add next config in server-side context (not in browser)
  if (next && typeof window === 'undefined') {
    (finalOptions as NextFetchOptions).next = next;
  }

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    let errorData: { message?: string; error?: string } = {};
    try {
      const text = await response.text();
      if (text.trim()) {
        errorData = JSON.parse(text);
      }
    } catch {
      errorData = {};
    }


    // Handle authentication errors - session expired or invalid
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') {
        const isClientEndpoint = url.includes('/clients/');
        const isChecklistEndpoint = url.includes('/visa_applications/checklist/');
        const isMessagesEndpoint = url.includes('/requested_reviews/') && url.includes('/messages');

        if (isClientEndpoint || isChecklistEndpoint || url.includes('/comment') || isMessagesEndpoint) {
          // Let hook handle the error for client/checklist/comments/messages endpoints
        } else {
          // Session expired - clear auth state and redirect
          const { logout } = useAuth.getState();
          logout();

          // Determine redirect path based on URL
          const redirectPath = url.includes('/client/')
            ? '/client-login'
            : '/admin-login';

          window.location.href = redirectPath;
        }
      }
    }
    
    throw new Error(
      errorData.message || 
      errorData.error || 
      `HTTP error! status: ${response.status}`
    );
  }

  // Handle empty responses (common for DELETE requests)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }
  
  const text = await response.text();
  if (!text.trim()) {
    return {} as T;
  }
  
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.warn('Failed to parse JSON response:', { text, parseError });
    return {} as T;
  }
}

// Fetch wrapper for public endpoints (no token required)
export async function publicFetcher<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorData: { message?: string; error?: string } = {};
    try {
      const text = await response.text();
      if (text.trim()) {
        errorData = JSON.parse(text);
      }
    } catch {
      // If JSON parsing fails, use empty object
      errorData = {};
    }
    throw new Error(
      errorData.message || 
      errorData.error || 
      `HTTP error! status: ${response.status}`
    );
  }

  // Handle empty responses (common for DELETE requests)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }
  
  const text = await response.text();
  if (!text.trim()) {
    return {} as T;
  }
  
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.warn('Failed to parse JSON response:', { text, parseError });
    return {} as T;
  }
}
