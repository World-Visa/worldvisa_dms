/**
 * FCM utility helpers — platform detection, token storage, prompt state.
 * All functions are SSR-safe and return safe defaults on the server.
 */

const FCM_TOKEN_KEY = "fcm_token";
const FCM_PROMPT_DISMISSED_KEY = "fcm_prompt_dismissed";
const IOS_BANNER_DISMISSED_KEY = "ios_install_banner_dismissed";

// ─── Platform Detection ───────────────────────────────────────────────────────

/** Returns true when running on an iOS device (iPhone / iPad). */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

/**
 * Returns true when the web app is running in standalone (PWA) mode.
 * On iOS this means the user added it to their Home Screen.
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/**
 * Returns true when the browser supports the FCM prerequisites:
 * Notification API, Service Workers, and Push API.
 */
export function isFCMSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

// ─── Token Storage ────────────────────────────────────────────────────────────

/** Retrieves the stored FCM token from localStorage. */
export function getStoredFCMToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FCM_TOKEN_KEY);
}

/** Persists a new FCM token to localStorage. */
export function setStoredFCMToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FCM_TOKEN_KEY, token);
}

/** Removes the stored FCM token (e.g. on logout). */
export function clearStoredFCMToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FCM_TOKEN_KEY);
}

/**
 * Returns true when the given token differs from the stored one,
 * meaning a new registration is needed.
 */
export function hasFCMTokenChanged(newToken: string): boolean {
  return getStoredFCMToken() !== newToken;
}

// ─── Prompt State ─────────────────────────────────────────────────────────────

/** Returns true when the user previously dismissed the notification prompt. */
export function isPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FCM_PROMPT_DISMISSED_KEY) === "true";
}

/** Marks the notification prompt as permanently dismissed. */
export function setPromptDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FCM_PROMPT_DISMISSED_KEY, "true");
}

/** Returns true when the user previously dismissed the iOS install banner. */
export function isIOSBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(IOS_BANNER_DISMISSED_KEY) === "true";
}

/** Marks the iOS install banner as permanently dismissed. */
export function setIOSBannerDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IOS_BANNER_DISMISSED_KEY, "true");
}
