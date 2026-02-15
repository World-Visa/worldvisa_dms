"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LocalNotificationTestButton() {
  const [isLoading, setIsLoading] = useState(false);

  const sendLocalTestNotification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Test notification from LOCAL API",
          type: "info",
          category: "general",
          link: "/test",
        }),
      });

      const result = await response.json();
      console.log("Local test notification result:", result);
    } catch (error) {
      console.error("Failed to send local test notification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={sendLocalTestNotification}
      disabled={isLoading}
      className="fixed bottom-4 left-20 z-50 bg-green-500 hover:bg-green-600"
      size="sm"
    >
      {isLoading ? "Sending..." : "Local Test"}
    </Button>
  );
}
