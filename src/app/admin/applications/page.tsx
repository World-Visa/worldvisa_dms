import { Suspense } from 'react';
import { ApplicationsClient } from '@/components/applications/ApplicationsClient';
import { ApplicationsTableSkeleton } from '@/components/applications/ApplicationsTableSkeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function AllApplicationsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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