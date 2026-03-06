/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error
import { io, type Socket } from "socket.io-client";
import { getStoredToken } from "./auth";
import {
  CHAT_API_BASE_URL,
  CHAT_ENDPOINTS,
  CHAT_SOCKET_EVENTS,
  CHAT_CONNECTION_CONFIG,
} from "@/lib/config/chat";
import type {
  ChatConnectionState,
  ChatMessageEvent,
  ChatReadEvent,
} from "@/types/chat";

type EventCallback<T = any> = (data: T) => void;
type ChatEventMap = {
  "chat:message": EventCallback<ChatMessageEvent>;
  "chat:read": EventCallback<ChatReadEvent>;
};

export class ChatSocketManager {
  private socket: typeof Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = CHAT_CONNECTION_CONFIG.MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = CHAT_CONNECTION_CONFIG.INITIAL_RECONNECT_DELAY;
  private maxReconnectDelay = CHAT_CONNECTION_CONFIG.MAX_RECONNECT_DELAY;
  private isConnecting = false;
  private isDestroyed = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private listeners = new Map<keyof ChatEventMap, Set<EventCallback>>();
  private connectionState: ChatConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null,
  };
  private stateListeners = new Set<(state: ChatConnectionState) => void>();

  constructor() {
    this.setupVisibilityHandling();
  }

  connect(): void {
    if (this.isConnecting || this.isConnected() || this.isDestroyed) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      this.handleConnectionError("No authentication token available");
      return;
    }

    this.isConnecting = true;
    this.updateConnectionState({ isConnecting: true, error: null });

    try {
      this.socket = io(CHAT_API_BASE_URL, {
        path: CHAT_ENDPOINTS.SOCKET_PATH,
        auth: { token },
        transports: CHAT_CONNECTION_CONFIG.TRANSPORTS,
        reconnection: false,
        timeout: CHAT_CONNECTION_CONFIG.CONNECTION_TIMEOUT,
        forceNew: true,
      });

      this.connectionTimeout = setTimeout(() => {
        if (this.isConnecting && !this.isConnected()) {
          this.handleConnectionError("Connection timeout");
        }
      }, CHAT_CONNECTION_CONFIG.CONNECTION_TIMEOUT);

      this.setupEventListeners();
    } catch (error) {
      this.handleConnectionError(
        `Failed to create socket: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  onChatMessage(callback: EventCallback<ChatMessageEvent>): () => void {
    return this.subscribe(CHAT_SOCKET_EVENTS.MESSAGE as keyof ChatEventMap, callback);
  }

  onChatRead(callback: EventCallback<ChatReadEvent>): () => void {
    return this.subscribe(CHAT_SOCKET_EVENTS.READ as keyof ChatEventMap, callback);
  }

  onConnectionStateChange(
    callback: (state: ChatConnectionState) => void,
  ): () => void {
    this.stateListeners.add(callback);
    callback(this.connectionState);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect(): void {
    this.cleanup();
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }

  destroy(): void {
    this.isDestroyed = true;
    this.cleanup();
    this.listeners.clear();
    this.stateListeners.clear();
  }

  private cleanup(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  private subscribe(
    event: keyof ChatEventMap,
    callback: EventCallback,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket && this.socket.connected) {
      this.socket.on(event, callback);
    }

    return () => {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.reconnectAttempts = 0;
      this.reconnectDelay = CHAT_CONNECTION_CONFIG.INITIAL_RECONNECT_DELAY;
      this.isConnecting = false;

      this.updateConnectionState({
        isConnected: true,
        isConnecting: false,
        error: null,
        lastEvent: "connected",
      });

      // Re-subscribe all registered listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket!.on(event, callback);
        });
      });
    });

    this.socket.on("connect_error", (error: any) => {
      this.handleConnectionError(error.message || "Connection failed");
    });

    this.socket.on("disconnect", (reason: any) => {
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        error: reason,
        lastEvent: "disconnected",
      });

      if (reason !== "io client disconnect" && !this.isDestroyed) {
        this.scheduleReconnect();
      }
    });

    this.socket.on(CHAT_SOCKET_EVENTS.MESSAGE, () => {
      this.updateConnectionState({ lastEvent: CHAT_SOCKET_EVENTS.MESSAGE });
    });

    this.socket.on(CHAT_SOCKET_EVENTS.READ, () => {
      this.updateConnectionState({ lastEvent: CHAT_SOCKET_EVENTS.READ });
    });
  }

  private handleConnectionError(error: string): void {
    this.isConnecting = false;
    this.reconnectAttempts++;

    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.isDestroyed
    ) {
      this.scheduleReconnect();
    }

    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error,
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout || this.isDestroyed) return;

    const jitter = Math.random() * 1000;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + jitter,
      this.maxReconnectDelay,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (!this.isDestroyed) {
        this.connect();
      }
    }, delay);
  }

  private updateConnectionState(
    updates: Partial<ChatConnectionState>,
  ): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.stateListeners.forEach((callback) => callback(this.connectionState));
  }

  private setupVisibilityHandling(): void {
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (
          document.visibilityState === "visible" &&
          !this.isConnected() &&
          !this.isDestroyed
        ) {
          this.connect();
        }
      });

      window.addEventListener("online", () => {
        if (!this.isConnected() && !this.isDestroyed) {
          this.connect();
        }
      });

      window.addEventListener("offline", () => {
        this.updateConnectionState({
          isConnected: false,
          isConnecting: false,
          error: "Network offline",
        });
      });
    }
  }
}

// Singleton instance
export const chatSocket = new ChatSocketManager();
