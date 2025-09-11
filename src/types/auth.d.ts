export interface User {
  _id: string;
  username?: string;
  email?: string;
  role: 'admin' | 'client' | 'master_admin';
  lead_id?: string;
}

export interface AuthResponse {
  status: 'success' | 'error';
  token: string;
  data: {
    user: User;
  };
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface ClientLoginRequest {
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface JWTPayload {
  id: string;
  username?: string;
  email?: string;
  role: 'admin' | 'client' | 'master_admin';
  lead_id?: string;
  iat: number;
  exp: number;
}
