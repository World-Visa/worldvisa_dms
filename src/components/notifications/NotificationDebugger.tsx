/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { notificationSocket } from "@/lib/notificationSocket";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationDebugger() {
  const { isAuthenticated } = useAuth();
  const { soundEnabled, desktopNotificationsEnabled } = useNotificationStore();
  const [connectionState, setConnectionState] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Monitor connection state
    const unsubscribeConnection = notificationSocket.onConnectionStateChange(
      (state) => {
        setConnectionState(state);
        addLog(`Connection state changed: ${JSON.stringify(state)}`);
      },
    );

    // Monitor new notifications
    const unsubscribeNew = notificationSocket.onNotificationNew(
      (notification) => {
        addLog(`New notification received: ${notification.message}`);
      },
    );

    // Monitor updated notifications
    const unsubscribeUpdated = notificationSocket.onNotificationUpdated(
      (notification) => {
        addLog(`Notification updated: ${notification._id}`);
      },
    );

    // Monitor deleted notifications
    const unsubscribeDeleted = notificationSocket.onNotificationDeleted(
      (notification) => {
        addLog(`Notification deleted: ${notification._id}`);
      },
    );

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      setMetrics(notificationSocket.getMetrics());
    }, 2000);

    return () => {
      unsubscribeConnection();
      unsubscribeNew();
      unsubscribeUpdated();
      unsubscribeDeleted();
      clearInterval(metricsInterval);
    };
  }, [isAuthenticated]);

  const testSound = () => {
    try {
      const audio = new Audio("/sound/notification.mp3");
      audio.volume = 0.5;
      audio
        .play()
        .then(() => {
          addLog("Sound test: SUCCESS");
        })
        .catch((error) => {
          addLog(`Sound test: FAILED - ${error.message}`);
        });
    } catch (error) {
      addLog(`Sound test: ERROR - ${error}`);
    }
  };

  const testDesktopNotification = () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Test Notification", {
          icon: "/favicon.ico",
          body: "This is a test notification",
        });
        addLog("Desktop notification test: SUCCESS");
      } else {
        Notification.requestPermission().then((permission) => {
          addLog(`Desktop notification permission: ${permission}`);
        });
      }
    } else {
      addLog("Desktop notifications not supported");
    }
  };

  const forceReconnect = () => {
    addLog("Forcing socket reconnection...");
    notificationSocket.disconnect();
    setTimeout(() => {
      notificationSocket.connect();
      addLog("Socket reconnection attempted");
    }, 1000);
  };

  const forceResubscribe = () => {
    addLog("Forcing listener re-subscription...");
    notificationSocket.forceResubscribe();
    addLog("Listener re-subscription attempted");
  };

  const forceRefresh = () => {
    addLog("Forcing page refresh...");
    window.location.reload();
  };

  const triggerManualTest = () => {
    addLog("Triggering manual test notification...");
    notificationSocket.triggerTestNotification();
    addLog("Manual test notification triggered");
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-500 hover:bg-red-600"
        size="sm"
      >
        Debug Notifications
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 z-50 bg-white shadow-2xl overflow-y-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Notification Debugger</CardTitle>
          <Button
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Connection Status */}
        <div className="space-y-1">
          <div className="font-semibold">Connection Status:</div>
          <div
            className={`px-2 py-1 rounded text-xs ${
              connectionState?.isConnected
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {connectionState?.isConnected ? "Connected" : "Disconnected"}
          </div>
          {connectionState?.error && (
            <div className="text-red-600 text-xs">
              Error: {connectionState.error}
            </div>
          )}
        </div>

        {/* Authentication Status */}
        <div className="space-y-1">
          <div className="font-semibold">Auth Status:</div>
          <div
            className={`px-2 py-1 rounded text-xs ${
              isAuthenticated
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-1">
          <div className="font-semibold">Settings:</div>
          <div className="text-xs">
            Sound: {soundEnabled ? "✅" : "❌"} | Desktop:{" "}
            {desktopNotificationsEnabled ? "✅" : "❌"}
          </div>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="space-y-1">
            <div className="font-semibold">Metrics:</div>
            <div className="text-xs space-y-1">
              <div>Connections: {metrics.connectionAttempts}</div>
              <div>Successful: {metrics.successfulConnections}</div>
              <div>Failed: {metrics.failedConnections}</div>
              <div>Messages: {metrics.messagesReceived}</div>
            </div>
          </div>
        )}

        {/* Test Buttons */}
        <div className="space-y-1">
          <div className="font-semibold">Tests:</div>
          <div className="flex flex-wrap gap-1">
            <Button onClick={testSound} size="sm" className="text-xs h-6">
              Test Sound
            </Button>
            <Button
              onClick={testDesktopNotification}
              size="sm"
              className="text-xs h-6"
            >
              Test Desktop
            </Button>
            <Button onClick={forceReconnect} size="sm" className="text-xs h-6">
              Reconnect
            </Button>
            <Button
              onClick={forceResubscribe}
              size="sm"
              className="text-xs h-6"
            >
              Resubscribe
            </Button>
            <Button onClick={forceRefresh} size="sm" className="text-xs h-6">
              Refresh
            </Button>
            <Button
              onClick={triggerManualTest}
              size="sm"
              className="text-xs h-6"
            >
              Manual Test
            </Button>
          </div>
        </div>

        {/* Logs */}
        <div className="space-y-1">
          <div className="font-semibold">Recent Logs:</div>
          <div className="max-h-20 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-xs">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
