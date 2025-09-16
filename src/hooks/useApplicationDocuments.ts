import { useQuery } from '@tanstack/react-query';
import { getApplicationDocuments, getAllApplicationDocuments } from '@/lib/api/getApplicationDocuments';

export function useApplicationDocuments(id: string) {
  return useQuery({
    queryKey: ['application-documents', id],
    queryFn: () => getApplicationDocuments(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAllApplicationDocuments(id: string) {
  return useQuery({
    queryKey: ['application-documents-all', id],
    queryFn: () => getAllApplicationDocuments(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
