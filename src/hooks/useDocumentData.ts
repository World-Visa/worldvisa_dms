import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Document } from '@/types/applications';

/**
 * Custom hook to get document data with real-time updates
 * This hook automatically subscribes to cache changes and provides
 * the most up-to-date document data
 */
export function useDocumentData(documentId: string) {
  const queryClient = useQueryClient();

  // Use React Query to get the document data
  // This will automatically re-render when the cache changes
  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => {
      // Get from cache first
      const cachedDocument = queryClient.getQueryData<Document>(['document', documentId]);
      if (cachedDocument) {
        return cachedDocument;
      }
      // If not in cache, we need to fetch it
      // This would typically be an API call, but for now we'll return null
      // and let the parent component handle the fallback
      return null;
    },
    enabled: !!documentId,
    staleTime: 0, // Always consider data stale to get real-time updates
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Use placeholder data to prevent loading states
    placeholderData: (previousData) => previousData,
    refetchOnReconnect: false,
  });

  return {
    document,
    isLoading,
    error,
    // Helper function to get document from cache synchronously
    getDocumentFromCache: () => queryClient.getQueryData<Document>(['document', documentId])
  };
}

/**
 * Hook to get multiple documents with real-time updates
 */
export function useDocumentsData(documentIds: string[]) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['documents', documentIds],
    queryFn: () => {
      return documentIds.map(id => 
        queryClient.getQueryData<Document>(['document', id])
      ).filter(Boolean) as Document[];
    },
    enabled: documentIds.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
