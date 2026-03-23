import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createServerQueryClient } from "@/lib/react-query/server";
import { cookies } from "next/headers";
import RequestedDocsClient from "./RequestedDocsClient";

export default async function RequestedDocsPage() {
  await cookies();

  const queryClient = createServerQueryClient();

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense>
        <RequestedDocsClient />
      </Suspense>
    </HydrationBoundary>
  );
}
