export type UserRole =
  | 'admin'
  | 'client'
  | 'master_admin'
  | 'team_leader'
  | 'supervisor';


export interface ClerkPublicMetadata {
  role?: UserRole;
  user_id?: string;
  lead_id?: string;
  username?: string;
  mcube_username?: string;
}

/** Stable user shape consumed by 40+ components via useAuth() */
export interface AppUser {
  _id: string;
  role: UserRole;
  email?: string;
  username?: string;
  lead_id?: string;
  mcube_username?: string;
}

export interface JWTPayload {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  role?: UserRole;
  lead_id?: string;
  iat?: number;
  exp?: number;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface ClientLoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  user: AppUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
