import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createServerQueryClient } from "@/lib/react-query/server";
import { cookies } from "next/headers";
import ApprovalRequestsClient from "./ApprovalRequestsClient";

export const metadata = { title: "Approval Requests" };

export default async function ApprovalRequestsPage() {
  await cookies();
  const queryClient = createServerQueryClient();
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense>
        <ApprovalRequestsClient />
      </Suspense>
    </HydrationBoundary>
  );
}
