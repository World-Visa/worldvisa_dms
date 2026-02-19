"use client";

import { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState, AdminLoginRequest, ClientLoginRequest } from "@/types/auth";
import { adminLogin, clientLogin } from "@/lib/zoho";
import { tokenStorage, sessionTokenStorage, getStoredToken, removeStoredToken, parseToken, isTokenExpired } from "@/lib/auth";
import { clearAllCacheData } from "@/lib/cacheUtils";

// Type for client login response structure
interface ClientLoginResponse {
  status: "success" | "error";
  token: string;
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  lead_id?: string;
  role?: "admin" | "client" | "master_admin" | "team_leader" | "supervisor";
}

interface AuthStore extends AuthState {
  login: (
    credentials: AdminLoginRequest | ClientLoginRequest,
    type: "admin" | "client",
    rememberMe?: boolean,
  ) => Promise<void>;
  logout: (queryClient?: QueryClient) => void;
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

      login: async (credentials, type, rememberMe = false) => {
        set({ isLoading: true, error: null });

        try {
          const response =
            type === "admin"
              ? await adminLogin(credentials as AdminLoginRequest)
              : await clientLogin(credentials as ClientLoginRequest);

          if (response.status === "success") {
            const token = response.token;

            // Handle different response structures for admin vs client login
            let userData;
            if (response.data && response.data.user) {
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
              _id: userData._id || "",
              username: userData.username,
              email: userData.email,
              lead_id: userData.lead_id,
              role: userData?.role || "client",
            };

            // rememberMe=true → localStorage (survives browser restarts)
            // rememberMe=false → sessionStorage (cleared on tab/browser close)
            if (rememberMe) {
              tokenStorage.set(token);
              if (typeof window !== "undefined") {
                localStorage.setItem("user_data", JSON.stringify(user));
              }
            } else {
              sessionTokenStorage.set(token);
              if (typeof window !== "undefined") {
                sessionStorage.setItem("user_data", JSON.stringify(user));
              }
            }

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error("Login failed");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Login failed";
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

      logout: (queryClient?: QueryClient) => {
        // Clear all cache data including React Query cache, localStorage, and sockets
        clearAllCacheData(queryClient);

        // Also clear sessionStorage auth data (not covered by clearAllCacheData)
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("auth_token");
          sessionStorage.removeItem("user_data");
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
        // Prefer sessionStorage token (non-remembered), fall back to localStorage (remembered)
        const token = getStoredToken();

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
            // Read user_data from whichever storage has the token
            const storedUserData =
              typeof window !== "undefined"
                ? (sessionStorage.getItem("user_data") ?? localStorage.getItem("user_data"))
                : null;

            let user;
            if (storedUserData) {
              user = JSON.parse(storedUserData);
            } else {
              user = {
                _id: payload.id,
                username: payload.username,
                email: payload.email,
                role: payload.role,
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
            // Token is invalid or expired — clear both storages
            removeStoredToken();
            if (typeof window !== "undefined") {
              localStorage.removeItem("user_data");
              sessionStorage.removeItem("user_data");
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
          removeStoredToken();
          if (typeof window !== "undefined") {
            localStorage.removeItem("user_data");
            sessionStorage.removeItem("user_data");
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
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
