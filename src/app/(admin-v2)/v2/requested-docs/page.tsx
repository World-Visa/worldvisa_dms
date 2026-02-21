import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createServerQueryClient } from "@/lib/react-query/server";
import { cookies } from "next/headers";
import RequestedDocsClient from "./RequestedDocsClient";
import { getRequestedDocumentsToMe } from "@/lib/api/requestedDocuments";

export default async function RequestedDocsPage() {
  await cookies();

  const queryClient = createServerQueryClient();

  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["requested-documents-to-me", 1, 10, {}],
      queryFn: () => getRequestedDocumentsToMe({ page: 1, limit: 10 }),
    }),
    queryClient.prefetchQuery({
      queryKey: ["requested-documents-to-me"],
      queryFn: () => getRequestedDocumentsToMe({}),
    }),
  ]);

  prefetchResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Failed to prefetch requested documents data",
        result.reason,
      );
    }
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <RequestedDocsClient />
    </HydrationBoundary>
  );
}
