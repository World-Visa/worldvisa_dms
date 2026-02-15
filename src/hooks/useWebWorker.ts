"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface WorkerMessage {
  type: string;
  payload?: any;
  error?: string;
}

export function useWebWorker<T = any>(workerPath: string) {
  const workerRef = useRef<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);

  // Initialize worker
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safety

    try {
      workerRef.current = new Worker(new URL(workerPath, import.meta.url));

      workerRef.current.addEventListener(
        "message",
        (event: MessageEvent<WorkerMessage>) => {
          const { type, payload, error } = event.data;

          if (type === "SUCCESS") {
            setIsLoading(false);
            setError(null);
          } else if (type === "ERROR") {
            setIsLoading(false);
            setError(error || "Unknown worker error");
          }
        },
      );

      workerRef.current.addEventListener("error", (workerError) => {
        setIsLoading(false);
        setError(workerError.message);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create worker");
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [workerPath]);

  // Send message to worker
  const postMessage = useCallback((message: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const messageId = ++messageIdRef.current;
      setIsLoading(true);
      setError(null);

      const handleMessage = (
        event: MessageEvent<WorkerMessage & { messageId?: number }>,
      ) => {
        if (event.data.messageId !== messageId) return;

        workerRef.current?.removeEventListener("message", handleMessage);

        if (event.data.type === "SUCCESS") {
          setIsLoading(false);
          resolve(event.data.payload);
        } else {
          setIsLoading(false);
          setError(event.data.error || "Unknown error");
          reject(new Error(event.data.error || "Unknown error"));
        }
      };

      workerRef.current.addEventListener("message", handleMessage);
      workerRef.current.postMessage({ ...message, messageId });
    });
  }, []);

  // Process applications data
  const processApplications = useCallback(
    async (
      data: any[],
      filters: {
        search?: string;
        searchType?: string;
        dateRange?: {
          start?: string;
          end?: string;
        };
      },
    ) => {
      return postMessage({
        type: "PROCESS_APPLICATIONS",
        data,
        filters,
      });
    },
    [postMessage],
  );

  // Process categories data
  const processCategories = useCallback(
    async (
      data: any[],
      companies: any[],
      isClientView: boolean,
      checklistState: string,
    ) => {
      return postMessage({
        type: "PROCESS_CATEGORIES",
        data,
        companies,
        isClientView,
        checklistState,
      });
    },
    [postMessage],
  );

  return {
    processApplications,
    processCategories,
    isLoading,
    error,
    isSupported: typeof window !== "undefined" && "Worker" in window,
  };
}

// Specific hook for data processing worker
export function useDataProcessorWorker() {
  return useWebWorker("/workers/dataProcessor.worker.js");
}
