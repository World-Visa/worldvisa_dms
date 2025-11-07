import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import UnifiedApplicationDetailsPage from '@/components/applications/UnifiedApplicationDetailsPage';
import { getApplicationById } from '@/lib/api/getApplicationById';
import { getApplicationDocuments } from '@/lib/api/getApplicationDocuments';
import { getApplicationDocumentsPaginated } from '@/lib/api/getApplicationDocumentsPaginated';
import { createServerQueryClient } from '@/lib/react-query/server';

interface ApplicationDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ApplicationDetailsPage({ params }: ApplicationDetailsPageProps) {
  const { id: applicationId } = await params;
  const queryClient = createServerQueryClient();

  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['application', applicationId],
      queryFn: () => getApplicationById(applicationId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['application-documents', applicationId],
      queryFn: () => getApplicationDocuments(applicationId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['application-documents-paginated', applicationId, 1, 10],
      queryFn: () =>
        getApplicationDocumentsPaginated({
          applicationId,
          page: 1,
          limit: 10,
        }),
    }),
  ]);

  prefetchResults.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('Failed to prefetch application details', result.reason);
    }
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <UnifiedApplicationDetailsPage
        applicationId={applicationId}
        isSpouseApplication={false}
      />
    </HydrationBoundary>
  );
}
