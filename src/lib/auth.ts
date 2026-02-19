import { jwtVerify, SignJWT } from "jose";
import { JWTPayload } from "@/types/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

// Verify JWT token (for tokens signed by our system)
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Parse JWT token without verification (for external tokens like Zoho)
export function parseToken(token: string): JWTPayload | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload as JWTPayload;
  } catch (error) {
    console.error("Token parsing failed:", error);
    return null;
  }
}

// Create JWT token (for future use if needed)
export async function createToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  return token;
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Extract user role from token
export function getUserRole(
  token: string,
): "admin" | "client" | "master_admin" | "team_leader" | "supervisor" | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

// Token storage utilities (localStorage — persists across browser restarts)
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  },

  set: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("auth_token", token);
  },

  remove: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
  },

  isValid: (): boolean => {
    const token = tokenStorage.get();
    if (!token) return false;
    return !isTokenExpired(token);
  },
};

// Session token storage (sessionStorage — cleared when browser/tab closes)
export const sessionTokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("auth_token");
  },

  set: (token: string): void => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("auth_token", token);
  },

  remove: (): void => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("auth_token");
  },

  isValid: (): boolean => {
    const token = sessionTokenStorage.get();
    if (!token) return false;
    return !isTokenExpired(token);
  },
};

// Reads token from either storage — sessionStorage takes priority
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionTokenStorage.get() ?? tokenStorage.get();
}

// Removes token from both storages
export function removeStoredToken(): void {
  if (typeof window === "undefined") return;
  tokenStorage.remove();
  sessionTokenStorage.remove();
}

// Returns which storage currently holds the token
export function getTokenStorageType(): "local" | "session" | null {
  if (typeof window === "undefined") return null;
  if (sessionTokenStorage.get()) return "session";
  if (tokenStorage.get()) return "local";
  return null;
}
