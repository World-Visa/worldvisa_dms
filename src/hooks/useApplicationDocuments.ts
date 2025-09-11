import { useQuery } from '@tanstack/react-query';
import { getApplicationDocuments } from '@/lib/api/getApplicationDocuments';

export function useApplicationDocuments(id: string) {
  return useQuery({
    queryKey: ['application-documents', id],
    queryFn: () => getApplicationDocuments(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
