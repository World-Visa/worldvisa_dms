/**
 * Sample Documents Hook
 * 
 * This hook provides optimized access to sample documents with caching,
 * error handling, and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import { sampleDocumentService } from '@/lib/samples/sampleService';

interface UseSampleDocumentOptions {
  documentType: string;
  category: string;
  enabled?: boolean;
}

interface UseAllSampleDocumentsOptions {
  enabled?: boolean;
}

/**
 * Hook to get a specific sample document
 */
export function useSampleDocument({ 
  documentType, 
  category, 
  enabled = true 
}: UseSampleDocumentOptions) {
  return useQuery({
    queryKey: ['sample-document', documentType, category],
    queryFn: () => sampleDocumentService.getSampleDocument(documentType, category),
    enabled: enabled && !!documentType && !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to check if a document type has a sample document
 */
export function useHasSampleDocument({ 
  documentType, 
  category, 
  enabled = true 
}: UseSampleDocumentOptions) {
  return useQuery({
    queryKey: ['has-sample-document', documentType, category],
    queryFn: () => sampleDocumentService.hasSampleDocument(documentType, category),
    enabled: enabled && !!documentType && !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get all available sample documents
 */
export function useAllSampleDocuments({ 
  enabled = true 
}: UseAllSampleDocumentsOptions = {}) {
  return useQuery({
    queryKey: ['all-sample-documents'],
    queryFn: () => sampleDocumentService.getAllSampleDocuments(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for sample document download with error handling
 */
export function useDownloadSampleDocument() {
  return {
    downloadSample: async (samplePath: string, fileName: string) => {
      try {
        // Validate inputs
        if (!samplePath || !fileName) {
          return { 
            success: false, 
            error: 'Invalid sample document path or file name' 
          };
        }

        await sampleDocumentService.downloadSampleDocument(samplePath, fileName);
        return { success: true };
      } catch (error) {
        console.error('Download failed:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'Download failed';
        if (error instanceof Error) {
          if (error.message.includes('Invalid sample document path')) {
            errorMessage = 'Sample document is not available';
          } else if (error.message.includes('not accessible')) {
            errorMessage = 'Sample document is currently unavailable';
          } else if (error.message.includes('Invalid file name')) {
            errorMessage = 'Invalid file name provided';
          } else {
            errorMessage = error.message;
          }
        }
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
    }
  };
}

/**
 * Hook to get sample document metadata for multiple document types
 */
export function useSampleDocumentsMetadata(documentTypes: Array<{ documentType: string; category: string }>) {
  return useQuery({
    queryKey: ['sample-documents-metadata', documentTypes],
    queryFn: () => {
      return documentTypes.map(({ documentType, category }) => ({
        documentType,
        category,
        hasSample: sampleDocumentService.hasSampleDocument(documentType, category),
        sampleDocument: sampleDocumentService.getSampleDocument(documentType, category)
      }));
    },
    enabled: documentTypes.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
