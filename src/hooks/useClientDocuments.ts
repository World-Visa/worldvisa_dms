import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { ClientDocumentsResponse } from '@/types/client';

const API_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export function useClientDocuments(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['client-documents', page, limit],
    queryFn: async (): Promise<ClientDocumentsResponse> => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        return await fetcher<ClientDocumentsResponse>(`${API_BASE_URL}/clients/documents?${params.toString()}`);
      } catch {
        return {
          status: 'success' as const,
          data: {
            documents: []
          },
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalRecords: 0,
            limit: 10
          }
        };
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useAllClientDocuments() {
  return useQuery({
    queryKey: ['client-documents-all'],
    queryFn: async (): Promise<ClientDocumentsResponse> => {
      try {
        // Fetch all documents by setting a high limit to get all pages
        const params = new URLSearchParams({
          page: '1',
          limit: '1000', // High limit to get all documents
        });
        return await fetcher<ClientDocumentsResponse>(`${API_BASE_URL}/clients/documents?${params.toString()}`);
      } catch {
        return {
          status: 'success' as const,
          data: {
            documents: []
          },
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalRecords: 0,
            limit: 1000
          }
        };
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
}