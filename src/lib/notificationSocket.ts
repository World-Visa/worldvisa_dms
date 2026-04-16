// @ts-expect-error — socket.io-client types
import { io, type Socket } from "socket.io-client";
import { getClerkToken } from "./getToken";
import {
  NOTIFICATION_API_BASE_URL,
  NOTIFICATION_ENDPOINTS,
  SOCKET_EVENTS,
  CALL_LOG_SOCKET_EVENTS,
  CONNECTION_CONFIG,
} from "@/lib/config/notifications";
import { PRESENCE_SOCKET_EVENTS } from "@/lib/config/presence";
import type {
  NotificationNewEvent,
  NotificationUpdatedEvent,
  NotificationDeletedEvent,
  NotificationConnectionState,
} from "@/types/notifications";
import type { PresenceUpdateEvent, PresenceSnapshotEvent } from "@/types/presence";
import type { CallLog } from "@/types/callLog";

type Listener<T> = (data: T) => void;

export class NotificationSocketManager {
  private socket: typeof Socket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  private newListeners = new Set<Listener<NotificationNewEvent>>();
  private updatedListeners = new Set<Listener<NotificationUpdatedEvent>>();
  private deletedListeners = new Set<Listener<NotificationDeletedEvent>>();
  private presenceListeners = new Set<Listener<PresenceUpdateEvent>>();
  private presenceSnapshotListeners = new Set<Listener<PresenceSnapshotEvent>>();
  private stateListeners = new Set<(state: NotificationConnectionState) => void>();
  private callLogNewListeners = new Set<Listener<CallLog>>();
  private callLogUpdatedListeners = new Set<Listener<CallLog>>();
  private callInboundListeners = new Set<Listener<CallLog>>();
  private callHangupListeners  = new Set<Listener<CallLog>>();

  private connectionState: NotificationConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null,
  };

  constructor() {
    this.setupVisibilityHandling();
  }

  connect(): void {
    if (this.socket?.connected || this.connectionState.isConnecting || this.isDestroyed) return;

    this.updateConnectionState({ isConnecting: true, error: null });

    getClerkToken().then((token) => {
      if (!token) {
        // Not authenticated — silently bail, don't attempt socket connection
        this.updateConnectionState({ isConnecting: false });
        return;
      }
      this.openSocket(token);
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.reconnectAttempts = 0;
    this.updateConnectionState({ isConnected: false, isConnecting: false, error: null });
  }

  destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.newListeners.clear();
    this.updatedListeners.clear();
    this.deletedListeners.clear();
    this.presenceListeners.clear();
    this.presenceSnapshotListeners.clear();
    this.stateListeners.clear();
    this.callLogNewListeners.clear();
    this.callLogUpdatedListeners.clear();
    this.callInboundListeners.clear();
    this.callHangupListeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  onNotificationNew(cb: Listener<NotificationNewEvent>): () => void {
    this.newListeners.add(cb);
    if (this.socket?.connected) this.socket.on(SOCKET_EVENTS.NEW, cb);
    return () => {
      this.newListeners.delete(cb);
      this.socket?.off(SOCKET_EVENTS.NEW, cb);
    };
  }

  onNotificationUpdated(cb: Listener<NotificationUpdatedEvent>): () => void {
    this.updatedListeners.add(cb);
    if (this.socket?.connected) this.socket.on(SOCKET_EVENTS.UPDATED, cb);
    return () => {
      this.updatedListeners.delete(cb);
      this.socket?.off(SOCKET_EVENTS.UPDATED, cb);
    };
  }

  onNotificationDeleted(cb: Listener<NotificationDeletedEvent>): () => void {
    this.deletedListeners.add(cb);
    if (this.socket?.connected) this.socket.on(SOCKET_EVENTS.DELETED, cb);
    return () => {
      this.deletedListeners.delete(cb);
      this.socket?.off(SOCKET_EVENTS.DELETED, cb);
    };
  }

  onPresenceUpdate(cb: Listener<PresenceUpdateEvent>): () => void {
    this.presenceListeners.add(cb);
    if (this.socket?.connected) this.socket.on(PRESENCE_SOCKET_EVENTS.UPDATE, cb);
    return () => {
      this.presenceListeners.delete(cb);
      this.socket?.off(PRESENCE_SOCKET_EVENTS.UPDATE, cb);
    };
  }

  onPresenceSnapshot(cb: Listener<PresenceSnapshotEvent>): () => void {
    this.presenceSnapshotListeners.add(cb);
    if (this.socket?.connected) this.socket.on(PRESENCE_SOCKET_EVENTS.SNAPSHOT, cb);
    return () => {
      this.presenceSnapshotListeners.delete(cb);
      this.socket?.off(PRESENCE_SOCKET_EVENTS.SNAPSHOT, cb);
    };
  }

  onCallLogNew(cb: Listener<CallLog>): () => void {
    this.callLogNewListeners.add(cb);
    if (this.socket?.connected) this.socket.on(CALL_LOG_SOCKET_EVENTS.NEW, cb);
    return () => {
      this.callLogNewListeners.delete(cb);
      this.socket?.off(CALL_LOG_SOCKET_EVENTS.NEW, cb);
    };
  }

  onCallLogUpdated(cb: Listener<CallLog>): () => void {
    this.callLogUpdatedListeners.add(cb);
    if (this.socket?.connected) this.socket.on(CALL_LOG_SOCKET_EVENTS.UPDATED, cb);
    return () => {
      this.callLogUpdatedListeners.delete(cb);
      this.socket?.off(CALL_LOG_SOCKET_EVENTS.UPDATED, cb);
    };
  }

  onCallInbound(cb: Listener<CallLog>): () => void {
    this.callInboundListeners.add(cb);
    if (this.socket?.connected) this.socket.on(CALL_LOG_SOCKET_EVENTS.INBOUND, cb);
    return () => {
      this.callInboundListeners.delete(cb);
      this.socket?.off(CALL_LOG_SOCKET_EVENTS.INBOUND, cb);
    };
  }

  onCallHangup(cb: Listener<CallLog>): () => void {
    this.callHangupListeners.add(cb);
    if (this.socket?.connected) this.socket.on(CALL_LOG_SOCKET_EVENTS.HANGUP, cb);
    return () => {
      this.callHangupListeners.delete(cb);
      this.socket?.off(CALL_LOG_SOCKET_EVENTS.HANGUP, cb);
    };
  }

  sendHeartbeat(): void {
    this.socket?.emit(PRESENCE_SOCKET_EVENTS.HEARTBEAT);
  }

  sendActivity(): void {
    this.socket?.emit(PRESENCE_SOCKET_EVENTS.ACTIVITY);
  }

  subscribeToUsers(userIds: string[]): void {
    if (userIds.length === 0) return;
    this.socket?.emit(PRESENCE_SOCKET_EVENTS.SUBSCRIBE, { userIds });
  }

  onConnectionStateChange(cb: (state: NotificationConnectionState) => void): () => void {
    this.stateListeners.add(cb);
    cb(this.connectionState);
    return () => this.stateListeners.delete(cb);
  }

  private openSocket(token: string): void {
    if (this.socket?.connected || this.isDestroyed) return;

    try {
      this.socket = io(NOTIFICATION_API_BASE_URL, {
        path: NOTIFICATION_ENDPOINTS.SOCKET_PATH,
        auth: { token },
        transports: CONNECTION_CONFIG.TRANSPORTS,
        reconnection: false,
        timeout: CONNECTION_CONFIG.CONNECTION_TIMEOUT,
        forceNew: true,
      });
    } catch {
      this.handleError("Failed to create socket");
      return;
    }

    const s = this.socket;
    if (!s) return;

    s.on("connect", () => {
      this.reconnectAttempts = 0;
      this.updateConnectionState({ isConnected: true, isConnecting: false, error: null, lastEvent: "connected" });
      this.reattachListeners();
    });

    s.on("connect_error", (err: { message?: string }) => {
      this.handleError(err?.message ?? "Connection failed");
    });

    s.on("disconnect", (reason: string) => {
      this.updateConnectionState({ isConnected: false, isConnecting: false, error: reason, lastEvent: "disconnected" });
      if (reason !== "io client disconnect" && !this.isDestroyed) {
        this.scheduleReconnect();
      }
    });

    // Server sends notification:all instead of notification:new — map it
    s.on("notification:all", (data: { data?: NotificationNewEvent[] }) => {
      const latest = data?.data?.[0];
      if (!latest) return;
      for (const cb of this.newListeners) {
        try { cb(latest); } catch { /* ignore listener errors */ }
      }
    });
  }

  private reattachListeners(): void {
    const s = this.socket;
    if (!s) return;
    for (const cb of this.newListeners) s.on(SOCKET_EVENTS.NEW, cb);
    for (const cb of this.updatedListeners) s.on(SOCKET_EVENTS.UPDATED, cb);
    for (const cb of this.deletedListeners) s.on(SOCKET_EVENTS.DELETED, cb);
    for (const cb of this.presenceListeners) s.on(PRESENCE_SOCKET_EVENTS.UPDATE, cb);
    for (const cb of this.presenceSnapshotListeners) s.on(PRESENCE_SOCKET_EVENTS.SNAPSHOT, cb);
    for (const cb of this.callLogNewListeners) s.on(CALL_LOG_SOCKET_EVENTS.NEW, cb);
    for (const cb of this.callLogUpdatedListeners) s.on(CALL_LOG_SOCKET_EVENTS.UPDATED, cb);
    for (const cb of this.callInboundListeners) s.on(CALL_LOG_SOCKET_EVENTS.INBOUND, cb);
    for (const cb of this.callHangupListeners)  s.on(CALL_LOG_SOCKET_EVENTS.HANGUP, cb);
  }

  private handleError(error: string): void {
    this.updateConnectionState({ isConnected: false, isConnecting: false, error });
    if (this.reconnectAttempts < CONNECTION_CONFIG.MAX_RECONNECT_ATTEMPTS && !this.isDestroyed) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isDestroyed) return;
    const delay = Math.min(
      CONNECTION_CONFIG.INITIAL_RECONNECT_DELAY * 2 ** this.reconnectAttempts,
      CONNECTION_CONFIG.MAX_RECONNECT_DELAY,
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isDestroyed) this.connect();
    }, delay);
  }

  private updateConnectionState(updates: Partial<NotificationConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    for (const cb of this.stateListeners) cb(this.connectionState);
  }

  private setupVisibilityHandling(): void {
    if (typeof window === "undefined") return;

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && !this.isConnected() && !this.isDestroyed) {
        this.connect();
      }
    });

    window.addEventListener("online", () => {
      if (!this.isConnected() && !this.isDestroyed) this.connect();
    });

    window.addEventListener("offline", () => {
      this.updateConnectionState({ isConnected: false, isConnecting: false, error: "Network offline" });
    });
  }
}

export const notificationSocket = new NotificationSocketManager();
