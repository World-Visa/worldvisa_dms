import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { getSpouseApplicationById } from "@/lib/api/spouseApplications";
import { getAllApplicationDocuments } from "@/lib/api/getApplicationDocuments";
import { createServerQueryClient } from "@/lib/react-query/server";
import { ChecklistPage } from "@/components/checklist/ChecklistPage";

interface SpouseChecklistRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function SpouseChecklistRoutePage({
  params,
}: SpouseChecklistRoutePageProps) {
  const { id: applicationId } = await params;
  const queryClient = createServerQueryClient();

  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["spouse-application-details", applicationId, undefined],
      queryFn: () => getSpouseApplicationById(applicationId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["application-documents-all", applicationId],
      queryFn: () => getAllApplicationDocuments(applicationId),
    }),
  ]);

  prefetchResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Failed to prefetch spouse checklist page data", result.reason);
    }
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <ChecklistPage
        applicationId={applicationId}
        isSpouseApplication={true}
      />
    </HydrationBoundary>
  );
}
