import { useQuery } from '@tanstack/react-query';
import { getApplicationDocuments, getAllApplicationDocuments } from '@/lib/api/getApplicationDocuments';

export function useApplicationDocuments(id: string) {
  return useQuery({
    queryKey: ['application-documents', id],
    queryFn: () => getApplicationDocuments(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, 
    gcTime: 15 * 60 * 1000, 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

interface UseAllApplicationDocumentsOptions {
  enabled?: boolean;
}

export function useAllApplicationDocuments(
  id: string,
  options: UseAllApplicationDocumentsOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['application-documents-all', id],
    queryFn: () => getAllApplicationDocuments(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, 
    gcTime: 15 * 60 * 1000, 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}
