import { useQuery } from '@tanstack/react-query';
import { getApplicationById } from '@/lib/api/getApplicationById';

export function useApplicationDetails(id: string) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => getApplicationById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
