import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchSampleDocuments,
  uploadSampleDocument,
  updateSampleDocument,
  deleteSampleDocument,
} from '@/lib/api/sampleDocuments';
import type {
  UploadSampleDocumentRequest,
  UpdateSampleDocumentRequest,
} from '@/types/sampleDocuments';
import { sampleDocumentService } from '@/lib/samples/sampleService';

const queryKey = (applicationId: string) => ['sample-documents', applicationId];

export function useSampleDocuments(applicationId: string) {
  return useQuery({
    queryKey: queryKey(applicationId),
    queryFn: () => fetchSampleDocuments(applicationId),
    enabled: !!applicationId,
    staleTime: 30_000,
  });
}

export function useUploadSampleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadSampleDocumentRequest) => uploadSampleDocument(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKey(variables.applicationId),
      });
      toast.success('Sample document uploaded successfully!');
    },
    onError: (error: Error) => {
      console.error('Upload sample document error:', error);
      toast.error(`Failed to upload sample document: ${error.message}`);
    },
  });
}

export function useUpdateSampleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSampleDocumentRequest) => updateSampleDocument(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKey(variables.applicationId),
      });
      toast.success('Sample document updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Update sample document error:', error);
      toast.error(`Failed to update sample document: ${error.message}`);
    },
  });
}

export function useDeleteSampleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, documentId }: { applicationId: string; documentId: string }) =>
      deleteSampleDocument(applicationId, documentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKey(variables.applicationId),
      });
      toast.success('Sample document deleted successfully!');
    },
    onError: (error: Error) => {
      console.error('Delete sample document error:', error);
      toast.error(`Failed to delete sample document: ${error.message}`);
    },
  });
}

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
