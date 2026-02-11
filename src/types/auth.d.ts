export interface User {
  _id: string;
  username?: string;
  email?: string;
  role: "admin" | "client" | "master_admin" | "team_leader" | "supervisor";
  lead_id?: string;
}

export interface AuthResponse {
  status: "success" | "error";
  csrfToken: string;  // Changed from token to csrfToken (backend now returns this)
  user?: User;  // Backend returns user directly, not nested in data
  data?: {
    user: User;
  };
  // Client login response fields (when data.user is not present)
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  lead_id?: string;
  role?: "admin" | "client" | "master_admin" | "team_leader" | "supervisor";
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface ClientLoginRequest {
  email: string;
  password: string;
}

export interface ClientResetPasswordRequest {
  newPassword: string;
}

export interface AuthState {
  user: User | null;
  csrfToken: string | null;  // Changed from token - stores CSRF token for authenticated requests
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface JWTPayload {
  id: string;
  username?: string;
  email?: string;
  role: "admin" | "client" | "master_admin" | "team_leader" | "supervisor";
  lead_id?: string;
  iat: number;
  exp: number;
}
