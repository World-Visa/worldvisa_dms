import { Suspense } from "react";
import { ApplicationsClient } from "@/components/applications/ApplicationsClient";
import { ApplicationsTableLoadingState } from "@/components/applications/ApplicationsTableLoadingState";
import { createMeta } from "@/lib/seo";


export const metadata = createMeta({
  title: 'Applications',
  description:
    'View all applications in the WorldVisa DMS system.',
  noIndex: true,
});

export default function AllApplicationsPage() {
  return (
    <main className="">
      <Suspense
        fallback={<ApplicationsTableLoadingState />}
      >
        <ApplicationsClient />
      </Suspense>
    </main>
  );
}
