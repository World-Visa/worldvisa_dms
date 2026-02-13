import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Stage2Document,
  Stage2DocumentType,
  CreateStage2DocumentRequest,
  UpdateStage2DocumentRequest,
} from '@/types/stage2Documents';
import {
  fetchStage2Documents,
  uploadStage2Document,
  updateStage2Document,
  deleteStage2Document,
  reuploadStage2Document,
  type ReuploadStage2DocumentRequest,
} from '@/lib/api/stage2Documents';

export function useStage2Documents(
  applicationId: string,
  type?: Stage2DocumentType
) {
  return useQuery({
    queryKey: ['stage2-documents', applicationId, type],
    queryFn: () => fetchStage2Documents(applicationId, type),
    enabled: !!applicationId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to upload a new stage 2 document
 */
export function useUploadStage2Document() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStage2DocumentRequest) => uploadStage2Document(data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch all stage 2 document queries for this application
      queryClient.invalidateQueries({
        queryKey: ['stage2-documents', variables.applicationId],
      });
      
      toast.success('Document uploaded successfully!');
    },
    onError: (error: Error) => {
      console.error('Upload stage 2 document error:', error);
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });
}

/**
 * Hook to update stage 2 document metadata
 */
export function useUpdateStage2Document() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStage2DocumentRequest) => updateStage2Document(data),
    onSuccess: (data, variables) => {
      // Invalidate queries for this application
      queryClient.invalidateQueries({
        queryKey: ['stage2-documents', variables.applicationId],
      });
      
      toast.success('Document updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Update stage 2 document error:', error);
      toast.error(`Failed to update document: ${error.message}`);
    },
  });
}

/**
 * Hook to replace (reupload) the file for an existing stage 2 document
 */
export function useReuploadStage2Document() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReuploadStage2DocumentRequest) => reuploadStage2Document(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stage2-documents', variables.applicationId],
      });
      toast.success('Document file replaced successfully!');
    },
    onError: (error: Error) => {
      console.error('Reupload stage 2 document error:', error);
      toast.error(`Failed to replace file: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a stage 2 document
 */
export function useDeleteStage2Document() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, documentId }: { applicationId: string; documentId: string }) =>
      deleteStage2Document(applicationId, documentId),
    onSuccess: (data, variables) => {
      // Invalidate queries for this application
      queryClient.invalidateQueries({
        queryKey: ['stage2-documents', variables.applicationId],
      });
      
      toast.success('Document deleted successfully!');
    },
    onError: (error: Error) => {
      console.error('Delete stage 2 document error:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });
}

