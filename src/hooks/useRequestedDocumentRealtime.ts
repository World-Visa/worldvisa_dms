import { useEffect, useState } from "react";
import { realtimeManager } from "@/lib/realtime";

export function useRequestedDocumentRealtimeState() {
  const [connectionState, setConnectionState] = useState(
    realtimeManager.getConnectionState(),
  );

  useEffect(() => {
    const unsubscribe = realtimeManager.onStateChange(setConnectionState);
    return unsubscribe;
  }, []);

  return connectionState;
}
