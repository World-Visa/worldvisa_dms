"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseMessaging } from "@/lib/firebase";
import { registerFCMTokenAPI } from "@/lib/api/fcm";
import {
  isIOS,
  isStandalone,
  isFCMSupported,
  getStoredFCMToken,
  setStoredFCMToken,
  hasFCMTokenChanged,
} from "@/utils/fcm";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY ?? "";
const SW_PATH = "/firebase-messaging-sw.js";

function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[FCM]", ...args);
  }
}

export interface UseFCMReturn {
  /** Current browser notification permission, or "unsupported" if not available. */
  permissionStatus: NotificationPermission | "unsupported";
  /** Whether an FCM token has been successfully registered this session. */
  isTokenRegistered: boolean;
  /** Requests browser permission then fetches and registers the FCM token. */
  requestPermissionAndRegister: () => Promise<void>;
  /** Whether the current device is an iOS device. */
  isIOSDevice: boolean;
  /** Whether the app is running in PWA standalone mode. */
  isStandaloneMode: boolean;
  /** True while the registration flow is in progress. */
  isLoading: boolean;
  /** Error message from the last failed registration attempt, or null. */
  error: string | null;
}

export function useFCM(): UseFCMReturn {
  const { user } = useAuth();

  const [permissionStatus, setPermissionStatus] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable device-level flags — computed once on mount, never change.
  const [isIOSDevice] = useState<boolean>(
    () => typeof window !== "undefined" && isIOS(),
  );
  const [isStandaloneMode] = useState<boolean>(
    () => typeof window !== "undefined" && isStandalone(),
  );

  // Holds the cleanup fn returned by onMessage so we can unsubscribe on unmount.
  const unsubscribeMessageRef = useRef<(() => void) | null>(null);
  // Prevents concurrent token refresh calls triggered by rapid visibility changes.
  const isRefreshingRef = useRef(false);
  // Cross-tab dedup: message IDs seen in other tabs via BroadcastChannel.
  const suppressedIdsRef = useRef<Set<string>>(new Set());
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const isClientUser = user?.role === "client";

  // ─── Sync permission status on mount ─────────────────────────────────────
  useEffect(() => {
    if (!isClientUser) return;
    if (!isFCMSupported()) {
      setPermissionStatus("unsupported");
      return;
    }
    setPermissionStatus(Notification.permission);
  }, [isClientUser]);

  // ─── Foreground message listener + auto-register if already granted ───────
  useEffect(() => {
    if (!isClientUser || !isFCMSupported()) return;
    if (Notification.permission !== "granted") return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    const userId = user?._id;

    // ── BroadcastChannel: cross-tab dedup ──────────────────────────────────
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("fcm_foreground");
      broadcastChannelRef.current = channel;
      channel.onmessage = (event: MessageEvent<{ messageId: string }>) => {
        suppressedIdsRef.current.add(event.data.messageId);
        // Auto-evict after 5 s to avoid unbounded growth
        setTimeout(() => suppressedIdsRef.current.delete(event.data.messageId), 5000);
      };
    }

    // ── Listen for messages while the app is open ──────────────────────────
    const unsubscribe = onMessage(messaging, (payload) => {
      devLog("Foreground message:", payload);

      // Derive a stable ID for dedup
      const title = payload.notification?.title ?? "New notification";
      const body = payload.notification?.body ?? "";
      const messageId =
        payload.messageId ??
        payload.collapseKey ??
        `${title}|${body}|${Date.now()}`;

      if (suppressedIdsRef.current.has(messageId)) {
        devLog("Foreground message suppressed (duplicate):", messageId);
        return;
      }

      // Broadcast to other tabs so they skip this message
      broadcastChannelRef.current?.postMessage({ messageId });

      toast(title, {
        description: body || undefined,
        duration: 6000,
      });
    });

    unsubscribeMessageRef.current = unsubscribe;

    // ── Token refresh on tab focus ─────────────────────────────────────────
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      if (isRefreshingRef.current || !userId) return;

      isRefreshingRef.current = true;
      try {
        const swReg = await navigator.serviceWorker
          .getRegistration(SW_PATH)
          .catch(() => undefined);

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (token && hasFCMTokenChanged(token)) {
          await registerFCMTokenAPI(userId, token);
          setStoredFCMToken(token);
          devLog("Token refreshed on visibility change");
        }
      } catch (err) {
        devLog("Token refresh failed:", err);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ── Initial silent registration if no token yet ────────────────────────
    if (!getStoredFCMToken() && userId) {
      const autoRegister = async () => {
        try {
          const swReg = await navigator.serviceWorker
            .getRegistration(SW_PATH)
            .catch(() => undefined);

          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swReg,
          });

          if (token && hasFCMTokenChanged(token)) {
            await registerFCMTokenAPI(userId, token);
            setStoredFCMToken(token);
            devLog("Token auto-registered");
          }

          if (token) setIsTokenRegistered(true);
        } catch (err) {
          devLog("Auto-register failed:", err);
        }
      };

      void autoRegister();
    } else if (getStoredFCMToken()) {
      setIsTokenRegistered(true);
    }

    return () => {
      unsubscribe();
      unsubscribeMessageRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClientUser, user?._id]);

  // ─── Main permission + registration flow ─────────────────────────────────
  const requestPermissionAndRegister = useCallback(async () => {
    if (!isClientUser) return;
    if (!isFCMSupported()) {
      setPermissionStatus("unsupported");
      return;
    }
    if (!user?._id) return;

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== "granted") {
        devLog("Permission not granted:", permission);
        return;
      }

      const messaging = getFirebaseMessaging();
      if (!messaging) throw new Error("Firebase messaging is not available");

      // Register / retrieve the existing service worker
      let swReg: ServiceWorkerRegistration | undefined;
      try {
        swReg = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });
        devLog("Service worker registered");
      } catch (swErr) {
        devLog("Service worker registration failed:", swErr);
        // Continue — getToken may still work with an existing SW
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (!token) throw new Error("Could not retrieve FCM token");

      if (hasFCMTokenChanged(token)) {
        await registerFCMTokenAPI(user._id, token);
        setStoredFCMToken(token);
        devLog("Token registered:", `${token.slice(0, 20)}…`);
      }

      setIsTokenRegistered(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to enable notifications";
      setError(message);
      devLog("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isClientUser, user?._id]);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      unsubscribeMessageRef.current?.();
    };
  }, []);

  return {
    permissionStatus,
    isTokenRegistered,
    requestPermissionAndRegister,
    isIOSDevice,
    isStandaloneMode,
    isLoading,
    error,
  };
}
