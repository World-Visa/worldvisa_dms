/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useCallback } from "react";

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export function usePerformanceMonitor(
  componentName: string,
  enabled: boolean = true,
) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  // Track render start
  useEffect(() => {
    if (enabled) {
      renderStartTime.current = performance.now();
      renderCount.current += 1;
    }
  });

  // Track render end and log metrics
  useEffect(() => {
    if (enabled && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;

      // Only log slow renders (> 16ms for 60fps)
      if (renderTime > 16) {
        const metrics: PerformanceMetrics = {
          renderTime,
          componentName,
          timestamp: Date.now(),
        };

        // Log to console in development
        if (process.env.NODE_ENV === "development") {
          console.warn(`Slow render detected in ${componentName}:`, {
            renderTime: `${renderTime.toFixed(2)}ms`,
            renderCount: renderCount.current,
            timestamp: new Date(metrics.timestamp).toISOString(),
          });
        }

        // Send to analytics/monitoring service in production
        if (process.env.NODE_ENV === "production") {
          // Example: Send to monitoring service
          // analytics.track('slow_render', metrics);
        }
      }
    }
  });

  // Return performance utilities
  return {
    renderCount: renderCount.current,
    measureAsync: useCallback(
      async <T>(
        operation: () => Promise<T>,
        operationName: string,
      ): Promise<T> => {
        const startTime = performance.now();
        try {
          const result = await operation();
          const duration = performance.now() - startTime;

          if (duration > 100) {
            // Log operations taking > 100ms
            console.warn(`Slow async operation in ${componentName}:`, {
              operation: operationName,
              duration: `${duration.toFixed(2)}ms`,
            });
          }

          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          console.error(`Failed async operation in ${componentName}:`, {
            operation: operationName,
            duration: `${duration.toFixed(2)}ms`,
            error,
          });
          throw error;
        }
      },
      [componentName],
    ),
  };
}

// Hook for measuring component mount/unmount times
export function useComponentLifecycle(
  componentName: string,
  enabled: boolean = true,
) {
  const mountTime = useRef<number>(0);
  const isMounted = useRef<boolean>(false);

  useEffect(() => {
    if (enabled) {
      mountTime.current = performance.now();
      isMounted.current = true;

      if (process.env.NODE_ENV === "development") {
      }
    }

    return () => {
      if (enabled && isMounted.current) {
        const lifecycleTime = performance.now() - mountTime.current;

        if (process.env.NODE_ENV === "development") {
        }
      }
    };
  }, [componentName, enabled]);

  return {
    isMounted: isMounted.current,
    getLifecycleTime: () =>
      isMounted.current ? performance.now() - mountTime.current : 0,
  };
}

// Hook for monitoring memory usage
export function useMemoryMonitor(
  componentName: string,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const checkMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        };

        // Log if memory usage is high (> 80% of limit)
        const usagePercentage = (memoryUsage.used / memoryUsage.limit) * 100;
        if (usagePercentage > 80) {
          console.warn(`High memory usage in ${componentName}:`, {
            used: `${memoryUsage.used}MB`,
            total: `${memoryUsage.total}MB`,
            limit: `${memoryUsage.limit}MB`,
            percentage: `${usagePercentage.toFixed(1)}%`,
          });
        }
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [componentName, enabled]);
}
