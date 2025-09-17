import React, { useRef, useEffect, useState } from 'react';

// Debounce utility for expensive operations
export function useOptimizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList,
  delay: number = 100
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  return ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }) as T;
}

// Memoization utility for expensive computations
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isExpensive: (prev: T, next: T) => boolean = (prev, next) => prev === next
): T {
  const ref = useRef<{ value: T; deps: React.DependencyList } | undefined>(undefined);
  
  const newValue = factory();
  if (!ref.current || !isExpensive(ref.current.value, newValue)) {
    ref.current = { value: newValue, deps };
  }
  
  return ref.current.value;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}

// Virtual scrolling utilities
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalHeight = items.length * itemHeight;
    
    return {
      visibleCount,
      totalHeight,
      overscanCount: overscan,
      getVisibleRange: (scrollTop: number) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
          startIndex + visibleCount + overscan,
          items.length - 1
        );
        
        return {
          startIndex: Math.max(0, startIndex - overscan),
          endIndex,
          visibleItems: items.slice(
            Math.max(0, startIndex - overscan),
            Math.min(startIndex + visibleCount + overscan, items.length)
          )
        };
      }
    };
  }, [items, itemHeight, containerHeight, overscan]);
}

// Performance monitoring utilities
export class PerformanceTracker {
  private static measurements = new Map<string, number[]>();
  
  static start(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      const measurements = this.measurements.get(name) || [];
      measurements.push(duration);
      this.measurements.set(name, measurements);
      
      // Log slow operations
      if (duration > 16) { // > 16ms (60fps threshold)
        console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  static getAverage(name: string): number {
    const measurements = this.measurements.get(name) || [];
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }
  
  static getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    const sorted = [...measurements].sort((a, b) => a - b);
    
    return {
      count: measurements.length,
      average: this.getAverage(name),
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0
    };
  }
}

// Bundle size optimization utilities
export function createLazyComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) {
  return React.lazy(importFn);
}

// Memory optimization utilities
export function useWeakRef<T extends object>(value: T) {
  const ref = useRef<WeakRef<T> | undefined>(undefined);
  
  if (!ref.current) {
    ref.current = new WeakRef(value);
  }
  
  return ref.current;
}

// Cache optimization utilities
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// React-specific optimizations
export const memo = React.memo;
export const useMemo = React.useMemo;
