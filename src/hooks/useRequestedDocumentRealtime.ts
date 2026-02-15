import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { realtimeManager, RequestedDocumentEvent } from "@/lib/realtime";
import { CommentEvent } from "@/types/comments";
import { RequestedDocument } from "@/lib/api/requestedDocuments";
import { useAuth } from "./useAuth";

/**
 * Hook to subscribe to real-time updates for requested documents
 * This provides real-time updates when documents are deleted, updated, or created
 */
export function useRequestedDocumentRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!user?.username || isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const unsubscribe = realtimeManager.subscribe(
      "requested-documents",
      (event: RequestedDocumentEvent | CommentEvent) => {
        console.log("📄 Requested document real-time event:", event);

        // Only handle requested document events
        if (!event.type.startsWith("requested_document_")) {
          return;
        }

        switch (event.type) {
          case "requested_document_deleted":
            // Remove the document from all relevant caches
            queryClient.setQueriesData(
              { queryKey: ["requested-documents-to-me"] },
              (old: { data: RequestedDocument[] } | undefined) => {
                if (!old?.data) return old;
                const filteredData = old.data.filter(
                  (doc: RequestedDocument) => doc._id !== event.document_id,
                );
                return {
                  ...old,
                  data: filteredData,
                };
              },
            );

            queryClient.setQueriesData(
              { queryKey: ["my-requested-documents"] },
              (old: { data: RequestedDocument[] } | undefined) => {
                if (!old?.data) return old;
                const filteredData = old.data.filter(
                  (doc: RequestedDocument) => doc._id !== event.document_id,
                );
                return {
                  ...old,
                  data: filteredData,
                };
              },
            );

            queryClient.setQueriesData(
              { queryKey: ["all-requested-documents"] },
              (old: { data: RequestedDocument[] } | undefined) => {
                if (!old?.data) return old;
                const filteredData = old.data.filter(
                  (doc: RequestedDocument) => doc._id !== event.document_id,
                );
                return {
                  ...old,
                  data: filteredData,
                };
              },
            );

            // Remove individual document cache
            queryClient.removeQueries({
              queryKey: ["requested-document", event.document_id],
            });
            break;

          case "requested_document_updated":
            if (event.document) {
              // Update the document in all relevant caches
              queryClient.setQueriesData(
                { queryKey: ["requested-documents-to-me"] },
                (old: { data: RequestedDocument[] } | undefined) => {
                  if (!old?.data) return old;
                  const updatedData = old.data.map((doc: RequestedDocument) =>
                    doc._id === event.document_id ? event.document! : doc,
                  );
                  return {
                    ...old,
                    data: updatedData,
                  };
                },
              );

              queryClient.setQueriesData(
                { queryKey: ["my-requested-documents"] },
                (old: { data: RequestedDocument[] } | undefined) => {
                  if (!old?.data) return old;
                  const updatedData = old.data.map((doc: RequestedDocument) =>
                    doc._id === event.document_id ? event.document! : doc,
                  );
                  return {
                    ...old,
                    data: updatedData,
                  };
                },
              );

              queryClient.setQueriesData(
                { queryKey: ["all-requested-documents"] },
                (old: { data: RequestedDocument[] } | undefined) => {
                  if (!old?.data) return old;
                  const updatedData = old.data.map((doc: RequestedDocument) =>
                    doc._id === event.document_id ? event.document! : doc,
                  );
                  return {
                    ...old,
                    data: updatedData,
                  };
                },
              );

              // Update individual document cache
              queryClient.setQueryData(
                ["requested-document", event.document_id],
                event.document,
              );
            }
            break;

          case "requested_document_created":
            if (event.document) {
              // Add the new document to relevant caches
              queryClient.setQueriesData(
                { queryKey: ["requested-documents-to-me"] },
                (old: { data: RequestedDocument[] } | undefined) => {
                  if (!old?.data) return old;
                  // Check if document is already in the list to avoid duplicates
                  const exists = old.data.some(
                    (doc: RequestedDocument) => doc._id === event.document_id,
                  );
                  if (exists) return old;

                  return {
                    ...old,
                    data: [event.document!, ...old.data],
                  };
                },
              );

              queryClient.setQueriesData(
                { queryKey: ["my-requested-documents"] },
                (old: { data: RequestedDocument[] } | undefined) => {
                  if (!old?.data) return old;
                  // Check if document is already in the list to avoid duplicates
                  const exists = old.data.some(
                    (doc: RequestedDocument) => doc._id === event.document_id,
                  );
                  if (exists) return old;

                  return {
                    ...old,
                    data: [event.document!, ...old.data],
                  };
                },
              );

              queryClient.setQueriesData(
                { queryKey: ["all-requested-documents"] },
                (old: { data: RequestedDocument[] } | undefined) => {
                  if (!old?.data) return old;
                  // Check if document is already in the list to avoid duplicates
                  const exists = old.data.some(
                    (doc: RequestedDocument) => doc._id === event.document_id,
                  );
                  if (exists) return old;

                  return {
                    ...old,
                    data: [event.document!, ...old.data],
                  };
                },
              );

              // Cache individual document
              queryClient.setQueryData(
                ["requested-document", event.document_id],
                event.document,
              );
            }
            break;
        }
      },
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [user?.username, queryClient]);
}

/**
 * Hook to get real-time connection state for requested documents
 */
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
