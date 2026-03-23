const FCM_TOKEN_KEY = "fcm_token";
const FCM_PROMPT_DISMISSED_KEY = "fcm_prompt_dismissed";
const IOS_BANNER_DISMISSED_KEY = "ios_install_banner_dismissed";

// ─── Platform Detection ───────────────────────────────────────────────────────

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function isFCMSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

// ─── Token Storage ────────────────────────────────────────────────────────────

export function getStoredFCMToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FCM_TOKEN_KEY);
}

export function setStoredFCMToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FCM_TOKEN_KEY, token);
}

export function hasFCMTokenChanged(newToken: string): boolean {
  return getStoredFCMToken() !== newToken;
}

// ─── Prompt State ─────────────────────────────────────────────────────────────

export function isPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FCM_PROMPT_DISMISSED_KEY) === "true";
}

export function setPromptDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FCM_PROMPT_DISMISSED_KEY, "true");
}

export function isIOSBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(IOS_BANNER_DISMISSED_KEY) === "true";
}

export function setIOSBannerDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IOS_BANNER_DISMISSED_KEY, "true");
}
