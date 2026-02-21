import { Suspense } from "react";
import { ApplicationsClient } from "@/components/applications/ApplicationsClient";
import { ApplicationsTableSkeleton } from "@/components/applications/ApplicationsTableSkeleton";
import { Card, CardContent } from "@/components/ui/card";

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
