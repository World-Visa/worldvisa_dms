"use client";

import { useFCM } from "@/hooks/useFCM";
import { NotificationModal } from "@/components/IOSNotificationFlow";
import { useAuth } from "@/hooks/useAuth";

/**
 * Renders the notification opt-in modal/drawer for client users.
 *
 * - iOS (Safari, not installed as PWA): two-step flow — intent → iOS install guide
 * - Web / Mac / Android: two-step flow — intent → browser-allow hint (native popup shown simultaneously)
 * - Non-client roles: renders nothing
 */
export function NotificationPrompt() {
  const { user } = useAuth();
  const {
    permissionStatus,
    isTokenRegistered,
    requestPermissionAndRegister,
    isIOSDevice,
    isStandaloneMode,
  } = useFCM();

  // Only show for client users
  if (user?.role !== "client") return null;

  // Already handled — no prompt needed
  if (
    permissionStatus === "granted" ||
    permissionStatus === "denied" ||
    permissionStatus === "unsupported" ||
    isTokenRegistered
  ) {
    return null;
  }

  // iOS in standalone mode: permission can be requested directly (same as web)
  const isIOSNeedsInstall = isIOSDevice && !isStandaloneMode;

  return (
    <NotificationModal
      platform={isIOSNeedsInstall ? "ios" : "web"}
      onInstalled={requestPermissionAndRegister}
      onRequestPermission={requestPermissionAndRegister}
    />
  );
}
