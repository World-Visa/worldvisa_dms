export type Step = "intent" | "install" | "browser-allow";

export interface NotificationModalProps {
  /** "ios" shows the PWA install guide; "web" shows the browser-allow hint */
  platform: "ios" | "web";
  /** iOS: called after standalone mode is detected (PWA installed) */
  onInstalled?: () => void;
  /** Web: triggers Notification.requestPermission() + token registration */
  onRequestPermission?: () => Promise<void>;
}

