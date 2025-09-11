import { tokenStorage } from './auth';

// Generic fetch wrapper with automatic token attachment
export async function fetcher<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    
    // Add user role information from localStorage if available
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role) {
            headers['X-User-Role'] = user.role;
          }
        } catch (error) {
          console.warn('Failed to parse user data from localStorage:', error);
        }
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 
      errorData.error || 
      `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 
      errorData.error || 
      `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}
