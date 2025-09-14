import { useQuery } from '@tanstack/react-query';
import { getApplicationDocumentsPaginated } from '@/lib/api/getApplicationDocumentsPaginated';

export function useApplicationDocumentsPaginated(
  applicationId: string,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['application-documents-paginated', applicationId, page, limit],
    queryFn: () => getApplicationDocumentsPaginated({ applicationId, page, limit }),
    enabled: enabled && !!applicationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
