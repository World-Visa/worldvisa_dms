'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClientApplicationResponse, ClientDocument } from '@/types/client';
import { ClientDocumentsSummary } from './ClientDocumentsSummary';

interface ClientApplicationDetailsProps {
  data?: ClientApplicationResponse;
  documents?: ClientDocument[];
  isDocumentsLoading?: boolean;
  documentsError?: Error | null;
  isLoading: boolean;
  error: Error | null;
}

export function ClientApplicationDetails({ data, documents, isDocumentsLoading, documentsError, isLoading, error }: ClientApplicationDetailsProps) {
  if (isLoading) {
    return (
      <div className='flex flex-col lg:flex-row justify-between w-full gap-6 lg:gap-8 lg:items-end'>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Card className='w-full lg:max-w-xs lg:w-full'>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertDescription>
          Failed to load application details: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.data) {
    return (
      <Alert className="mb-8">
        <AlertDescription>
          No application data available.
        </AlertDescription>
      </Alert>
    );
  }

  const application = data.data;

  return (
    <div className='flex flex-col lg:flex-row justify-between w-full gap-6 lg:gap-8 lg:items-end'>
      <div className="space-y-4 w-full">
        {/* Documents Summary */}
        <ClientDocumentsSummary
          documents={documents}
          isLoading={isDocumentsLoading ?? false}
          error={documentsError ?? null}
        />
      </div>
      
      {/* Application Details Card */}
      <Card className='w-full lg:max-w-xs lg:w-full'>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{application.Name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{application.Email}</p>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{application.Phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
