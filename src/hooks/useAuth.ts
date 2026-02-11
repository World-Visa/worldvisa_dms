'use client';

import { QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AdminLoginRequest, ClientLoginRequest, User } from '@/types/auth';
import { adminLogin, clientLogin } from '@/lib/zoho';
import { clearAllCacheData } from '@/lib/cacheUtils';
import { API_CONFIG } from '@/lib/config/api';

// Type for client login response structure
interface ClientLoginResponse {
  status: 'success' | 'error';
  csrfToken: string;  // Changed from token
  user?: User;  // New session-based response includes user
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  lead_id?: string;
  role?: 'admin' | 'client' | 'master_admin' | 'team_leader' | 'supervisor';
}

interface AuthStore extends AuthState {
  login: (credentials: AdminLoginRequest | ClientLoginRequest, type: 'admin' | 'client') => Promise<void>;
  logout: (queryClient?: QueryClient) => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      csrfToken: null,  // Changed from token to csrfToken
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials, type) => {
        set({ isLoading: true, error: null });

        try {
          const response = type === 'admin'
            ? await adminLogin(credentials as AdminLoginRequest)
            : await clientLogin(credentials as ClientLoginRequest);

          if (response.status === 'success') {
            // Backend now returns csrfToken and user directly
            // Session cookie is set automatically by browser (HttpOnly)

            // Handle different response structures for admin vs client login
            let userData;
            if (response.user) {
              // New session-based response - user returned directly
              userData = response.user;
            } else if (response.data && response.data.user) {
              // Admin login response structure
              userData = response.data.user;
            } else {
              // Client login response structure - user data is directly in response
              const clientResponse = response as ClientLoginResponse;
              userData = {
                _id: clientResponse._id || clientResponse.id,
                username: clientResponse.username || clientResponse.name,
                email: clientResponse.email,
                lead_id: clientResponse.lead_id,
                role: clientResponse.role,
              };
            }

            const user = {
              _id: userData._id || '',
              username: userData.username,
              email: userData.email,
              lead_id: userData.lead_id,
              role: userData?.role || 'client',
            };

            // NEW: Store CSRF token only (not JWT token)
            // Cookie is stored automatically by browser (HttpOnly)
            // NO MORE: tokenStorage.set() or localStorage.setItem('user_data')

            set({
              user,
              csrfToken: response.csrfToken,  // Store CSRF token for future requests
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Login failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            csrfToken: null,  // Clear CSRF token on error
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async (queryClient?: QueryClient) => {
        // Call backend logout endpoint to clear session
        try {
          await fetch(`${API_CONFIG.BASE_URL}/users/logout`, {
            method: 'POST',
            credentials: 'include',  // Send session cookie
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Continue with local cleanup even if server logout fails
        }

        // Clear all cache data including React Query cache, localStorage, and sockets
        clearAllCacheData(queryClient);

        // Clear auth state
        set({
          user: null,
          csrfToken: null,  // Clear CSRF token
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });

        try {
          // NEW: Call validate-session endpoint (sends session cookie automatically)
          const response = await fetch(
            `${API_CONFIG.BASE_URL}/users/validate-session`,
            {
              credentials: 'include',  // CRITICAL: Send session cookie
            }
          );

          if (response.ok) {
            const data = await response.json();

            // Backend returns user data in response
            set({
              user: data.user || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Session invalid or expired
            set({
              user: null,
              csrfToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          // Network error or session validation failed
          console.error('Session validation error:', error);
          set({
            user: null,
            csrfToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        csrfToken: state.csrfToken,  // Store CSRF token (not JWT)
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
