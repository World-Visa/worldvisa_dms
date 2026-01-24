import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { getApplicationById } from '@/lib/api/getApplicationById';
import { getAllApplicationDocuments } from '@/lib/api/getApplicationDocuments';
import { getChecklist } from '@/lib/api/checklist';
import { createServerQueryClient } from '@/lib/react-query/server';
import { ChecklistPage } from '@/features/checklist/ChecklistPage';

interface ChecklistRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function ChecklistRoutePage({ params }: ChecklistRoutePageProps) {
  const { id: applicationId } = await params;
  const queryClient = createServerQueryClient();

  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['application', applicationId],
      queryFn: () => getApplicationById(applicationId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['application-documents-all', applicationId],
      queryFn: () => getAllApplicationDocuments(applicationId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['checklist', applicationId],
      queryFn: () => getChecklist(applicationId),
    }),
  ]);

  prefetchResults.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('Failed to prefetch checklist page data', result.reason);
    }
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <ChecklistPage applicationId={applicationId} isSpouseApplication={false} />
    </HydrationBoundary>
  );
}
