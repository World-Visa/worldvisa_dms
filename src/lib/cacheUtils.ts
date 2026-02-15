"use client";

import { QueryClient } from "@tanstack/react-query";
import { notificationSocket } from "./notificationSocket";

/**
 * Comprehensive cache clearing utility for logout
 * Clears all React Query cache, localStorage, and disconnects sockets
 */
export class CacheManager {
  private queryClient: QueryClient | null = null;

  constructor(queryClient?: QueryClient) {
    this.queryClient = queryClient || null;
  }

  /**
   * Set the query client instance
   */
  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Clear all React Query cache
   */
  clearQueryCache(): void {
    if (!this.queryClient) {
      console.warn("CacheManager: QueryClient not available");
      return;
    }

    try {
      // Clear all queries from the cache
      this.queryClient.clear();
      console.log("CacheManager: React Query cache cleared");
    } catch (error) {
      console.error("CacheManager: Error clearing React Query cache:", error);
    }
  }

  /**
   * Clear all localStorage data
   */
  clearLocalStorage(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);

      // Remove each key
      keys.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log("CacheManager: localStorage cleared");
    } catch (error) {
      console.error("CacheManager: Error clearing localStorage:", error);
    }
  }

  /**
   * Disconnect notification socket
   */
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

  /**
   * Clear all cached data (comprehensive cleanup)
   */
  clearAllCache(): void {
    console.log("CacheManager: Starting comprehensive cache cleanup...");

    // Clear React Query cache
    this.clearQueryCache();

    // Clear localStorage
    this.clearLocalStorage();

    // Disconnect sockets
    this.disconnectSockets();

    console.log("CacheManager: Comprehensive cache cleanup completed");
  }

  /**
   * Clear only user-specific data (for logout)
   */
  clearUserData(): void {
    console.log("CacheManager: Starting user data cleanup...");

    // Clear React Query cache
    this.clearQueryCache();

    // Clear localStorage (includes auth tokens and user data)
    this.clearLocalStorage();

    // Disconnect sockets
    this.disconnectSockets();

    console.log("CacheManager: User data cleanup completed");
  }
}

// Create a singleton instance
export const cacheManager = new CacheManager();

/**
 * Utility function to clear all cache data
 * This is the main function to call during logout
 */
export function clearAllCacheData(queryClient?: QueryClient): void {
  if (queryClient) {
    cacheManager.setQueryClient(queryClient);
  }

  cacheManager.clearUserData();
}

/**
 * Utility function to clear only React Query cache
 */
export function clearQueryCache(queryClient?: QueryClient): void {
  if (queryClient) {
    cacheManager.setQueryClient(queryClient);
  }

  cacheManager.clearQueryCache();
}

/**
 * Utility function to clear only localStorage
 */
export function clearLocalStorageData(): void {
  cacheManager.clearLocalStorage();
}

/**
 * Utility function to disconnect all sockets
 */
export function disconnectAllSockets(): void {
  cacheManager.disconnectSockets();
}
