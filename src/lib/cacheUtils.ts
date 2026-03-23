"use client";

import { QueryClient } from "@tanstack/react-query";
import { notificationSocket } from "./notificationSocket";

export class CacheManager {
  private queryClient: QueryClient | null = null;

  constructor(queryClient?: QueryClient) {
    this.queryClient = queryClient || null;
  }

  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  clearQueryCache(): void {
    if (!this.queryClient) {
      console.warn("CacheManager: QueryClient not available");
      return;
    }

    try {
      this.queryClient.clear();
      console.log("CacheManager: React Query cache cleared");
    } catch (error) {
      console.error("CacheManager: Error clearing React Query cache:", error);
    }
  }

  clearLocalStorage(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const keys = Object.keys(localStorage);

      keys.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log("CacheManager: localStorage cleared");
    } catch (error) {
      console.error("CacheManager: Error clearing localStorage:", error);
    }
  }

  disconnectSockets(): void {
    try {
      if (notificationSocket) {
        notificationSocket.destroy();
        console.log("CacheManager: Notification socket disconnected");
      }
    } catch (error) {
      console.error("CacheManager: Error disconnecting sockets:", error);
    }
  }

  clearAllCache(): void {
    console.log("CacheManager: Starting comprehensive cache cleanup...");

    this.clearQueryCache();

    this.clearLocalStorage();

    this.disconnectSockets();

    console.log("CacheManager: Comprehensive cache cleanup completed");
  }

  clearUserData(): void {
    console.log("CacheManager: Starting user data cleanup...");

    this.clearQueryCache();

    this.clearLocalStorage();

    this.disconnectSockets();

    console.log("CacheManager: User data cleanup completed");
  }
}

export const cacheManager = new CacheManager();


export function clearAllCacheData(queryClient?: QueryClient): void {
  if (queryClient) {
    cacheManager.setQueryClient(queryClient);
  }

  cacheManager.clearUserData();
}
