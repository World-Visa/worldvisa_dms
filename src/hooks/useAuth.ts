'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AdminLoginRequest, ClientLoginRequest } from '@/types/auth';
import { adminLogin, clientLogin } from '@/lib/zoho';
import { tokenStorage, parseToken, isTokenExpired } from '@/lib/auth';

interface AuthStore extends AuthState {
  login: (credentials: AdminLoginRequest | ClientLoginRequest, type: 'admin' | 'client') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
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
            const token = response.token;
            const userData = response.data.user;             
          
            const user = {
              _id: userData._id,
              username: userData.username,
              email: userData.email,
              lead_id: userData.lead_id,
              role: userData?.role,
            };            
            // Store token, role, and user data
            tokenStorage.set(token);
            if (typeof window !== 'undefined') {
              localStorage.setItem('user_data', JSON.stringify(user));
            }

            console.log("user>>>>>>>>>>>", user)
            
            set({
              user,
              token,
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
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        tokenStorage.remove();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_data');
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = tokenStorage.get();
        
        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        set({ isLoading: true });
        
        try {
          const payload = parseToken(token);          
          if (payload && !isTokenExpired(token)) {
            // Try to get stored user data from localStorage
            const storedUserData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
            
            let user;
            if (storedUserData) {
              // Use stored user data if available
              user = JSON.parse(storedUserData);
            } else {
              const role = payload.role;
              user = {
                _id: payload.id,
                username: payload.username,
                email: payload.email,
                role: role ,
                lead_id: payload.lead_id,
              };
            }
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Token is invalid or expired, clear auth state
            tokenStorage.remove();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user_data');
            }
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch {
          tokenStorage.remove();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_data');
          }
          set({
            user: null,
            token: null,
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
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
