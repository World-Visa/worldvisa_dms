import { fetcher } from "@/lib/fetcher";
import {
  NOTIFICATION_API_BASE_URL,
  NOTIFICATION_ENDPOINTS,
} from "@/lib/config/notifications";
import { withRetry } from "@/lib/api/retryUtils";

interface RegisterTokenRequest {
  userId: string;
  token: string;
  platform: "mobile" | "desktop" | "web";
  userAgent: string;
}

interface RegisterTokenResponse {
  status: "success" | "fail";
  message?: string;
}

function detectPlatform(): RegisterTokenRequest["platform"] {
  if (typeof navigator === "undefined") return "web";
  return /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
    ? "mobile"
    : "desktop";
}

/**
 * Registers an FCM token with the backend.
 * Retries up to 3 times with exponential backoff on transient failures.
 */
export async function registerFCMTokenAPI(
  userId: string,
  token: string,
): Promise<void> {
  const body: RegisterTokenRequest = {
    userId,
    token,
    platform: detectPlatform(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  await withRetry(
    () =>
      fetcher<RegisterTokenResponse>(
        `${NOTIFICATION_API_BASE_URL}${NOTIFICATION_ENDPOINTS.REGISTER_FCM_TOKEN}`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      ),
    { maxAttempts: 3, baseDelay: 1000 },
  );
}
