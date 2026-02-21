import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";

import UnifiedApplicationDetailsPage from "@/components/applications/UnifiedApplicationDetailsPage";
import { getApplicationDocuments } from "@/lib/api/getApplicationDocuments";
import { getSpouseApplicationById } from "@/lib/api/spouseApplications";
import { createServerQueryClient } from "@/lib/react-query/server";

interface SpouseApplicationDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: SpouseApplicationDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Spouse Application ${id}` };
}

export default async function SpouseApplicationDetailsPage({
  params,
}: SpouseApplicationDetailsPageProps) {
  const { id: applicationId } = await params;
  const queryClient = createServerQueryClient();

  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["spouse-application-details", applicationId, undefined],
      queryFn: () => getSpouseApplicationById(applicationId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["application-documents", applicationId],
      queryFn: () => getApplicationDocuments(applicationId),
    }),
  ]);

  prefetchResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Failed to prefetch spouse application details",
        result.reason,
      );
    }
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <UnifiedApplicationDetailsPage
        applicationId={applicationId}
        isSpouseApplication={true}
      />
    </HydrationBoundary>
  );
}
