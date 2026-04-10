"use client";

import { useEffect, useRef } from "react";
import { notificationSocket } from "@/lib/notificationSocket";

const HEARTBEAT_INTERVAL_MS = 25_000; // 25 seconds
const ACTIVITY_THROTTLE_MS  = 5_000;  // emit at most once per 5 seconds

/**
 * Sends presence:heartbeat every 25s and presence:activity on user interaction.
 * Pauses when the tab is hidden; resumes when visible.
 * Call once from NotificationProvider — runs for the lifetime of the session.
 */
export function usePresenceEmitter(): void {
  const lastActivityRef = useRef<number>(0);

  useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    function startHeartbeat() {
      if (heartbeatTimer) return;
      heartbeatTimer = setInterval(() => {
        if (document.visibilityState === "visible") {
          notificationSocket.sendHeartbeat();
        }
      }, HEARTBEAT_INTERVAL_MS);
    }

    function stopHeartbeat() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    }

    function handleActivity() {
      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRef.current = now;
      notificationSocket.sendActivity();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        startHeartbeat();
        notificationSocket.sendHeartbeat(); // immediate ping on resume
      } else {
        stopHeartbeat();
      }
    }

    // Start immediately if tab is visible
    if (document.visibilityState === "visible") {
      startHeartbeat();
    }

    const activityEvents = ["mousemove", "keydown", "click", "scroll"] as const;
    for (const event of activityEvents) {
      document.addEventListener(event, handleActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopHeartbeat();
      for (const event of activityEvents) {
        document.removeEventListener(event, handleActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
