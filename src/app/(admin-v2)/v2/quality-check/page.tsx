import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createServerQueryClient } from "@/lib/react-query/server";
import { cookies } from "next/headers";
import { QualityCheckClient } from "@/components/quality-check/QualityCheckClient";
import { getQualityCheckList } from "@/lib/api/qualityCheck";

export default async function QualityCheckPage() {
  await cookies();

  const queryClient = createServerQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["quality-check-list", { page: 1, limit: 10 }],
      queryFn: () => getQualityCheckList({ page: 1, limit: 10 }),
    });
  } catch (error) {
    console.error("Failed to prefetch quality check data", error);
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense>
        <QualityCheckClient />
      </Suspense>
    </HydrationBoundary>
  );
}
