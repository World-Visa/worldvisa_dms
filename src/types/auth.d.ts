export interface User {
  _id: string;
  username?: string;
  email?: string;
  role: 'admin' | 'client' | 'master_admin' | 'team_leader';
  lead_id?: string;
}

export interface AuthResponse {
  status: 'success' | 'error';
  token: string;
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
  role?: 'admin' | 'client' | 'master_admin' | 'team_leader';
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface ClientLoginRequest {
  email: string;
  password: string;
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
  role: 'admin' | 'client' | 'master_admin' | 'team_leader';
  lead_id?: string;
  iat: number;
  exp: number;
}
