import { AdminLoginRequest, ClientLoginRequest, AuthResponse } from '@/types/auth';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

// Generic fetch wrapper with error handling
async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
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

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

// Admin login API call
export async function adminLogin(credentials: AdminLoginRequest): Promise<AuthResponse> {
  return fetchWithErrorHandling<AuthResponse>(`${ZOHO_BASE_URL}/users/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Client login API call
export async function clientLogin(credentials: ClientLoginRequest): Promise<AuthResponse> {
  return fetchWithErrorHandling<AuthResponse>(`${ZOHO_BASE_URL}/clients/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Generic API call with authentication
export async function authenticatedFetch<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  return fetchWithErrorHandling<T>(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
