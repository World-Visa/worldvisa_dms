import { Suspense } from "react";
import { ApplicationsClient } from "@/components/applications/ApplicationsClient";
import { ApplicationsTableSkeleton } from "@/components/applications/ApplicationsTableSkeleton";
import { Card, CardContent } from "@/components/ui/card";
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
        fallback={
          <Card className="mb-6">
            <CardContent className="p-6">
              <ApplicationsTableSkeleton />
            </CardContent>
          </Card>
        }
      >
        <ApplicationsClient />
      </Suspense>
    </main>
  );
}
