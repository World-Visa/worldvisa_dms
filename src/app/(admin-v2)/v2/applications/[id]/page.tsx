import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";

import UnifiedApplicationDetailsPage from "@/components/applications/UnifiedApplicationDetailsPage";
import { getApplicationById } from "@/lib/api/getApplicationById";
import { getApplicationDocuments } from "@/lib/api/getApplicationDocuments";
import { createServerQueryClient } from "@/lib/react-query/server";

interface ApplicationDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ApplicationDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Application ${id}` };
}

export default async function ApplicationDetailsPage({
  params,
}: ApplicationDetailsPageProps) {
  const { id: applicationId } = await params;
  const queryClient = createServerQueryClient();

  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["application", applicationId],
      queryFn: () => getApplicationById(applicationId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["application-documents", applicationId],
      queryFn: () => getApplicationDocuments(applicationId),
    }),
  ]);

  prefetchResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Failed to prefetch application details", result.reason);
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
