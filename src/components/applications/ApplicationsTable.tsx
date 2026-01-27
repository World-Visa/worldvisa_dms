'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisaApplication } from '@/types/applications';
import { formatDate } from '@/utils/format';
import { Loader2 } from 'lucide-react';

interface ApplicationsTableProps {
  applications: VisaApplication[];
  currentPage: number;
  limit: number;
  isLoading?: boolean;
  isSearchMode?: boolean;
  searchResults?: VisaApplication[];
  isSearchLoading?: boolean;
  isSpouseApplication?: boolean;
}

const LoadingState = memo(function LoadingState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            Fetching data...
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

const EmptyState = memo(function EmptyState({
  isSearchMode
}: {
  isSearchMode: boolean
}) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
        {isSearchMode ? 'No search results found' : 'No applications found'}
      </TableCell>
    </TableRow>
  );
});

const TableRowComponent = memo(function TableRowComponent({
  application,
  index,
  isSearchMode,
  getSerialNumber,
  handleRowClick,
}: {
  application: VisaApplication;
  index: number;
  isSearchMode: boolean;
  getSerialNumber: (index: number) => number;
  handleRowClick: (id: string) => void;
}) {
  const hasAttachments = application.AttachmentCount > 0;

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleRowClick(application.id)}
    >
      <TableCell className="font-medium">
        {isSearchMode ? index + 1 : getSerialNumber(index)}
      </TableCell>
      <TableCell className="font-medium">
        {application.Name}
      </TableCell>
      <TableCell>{application.Email}</TableCell>
      <TableCell>{application.Phone || 'N/A'}</TableCell>
      <TableCell>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {application.Application_Handled_By || 'N/A'}
        </span>
      </TableCell>
      <TableCell>
        {application.Created_Time ? formatDate(application.Created_Time, 'time') : 'N/A'}
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="secondary"
          className={hasAttachments
            ? "bg-green-600 hover:bg-green-400 text-white"
            : "bg-gray-400 hover:bg-gray-300 text-white"
          }
        >
          {application.AttachmentCount}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

export const ApplicationsTable = memo(function ApplicationsTable({
  applications,
  currentPage,
  limit,
  isLoading = false,
  isSearchMode = false,
  searchResults = [],
  isSearchLoading = false,
  isSpouseApplication = false,
}: ApplicationsTableProps) {
  const router = useRouter();

  // Memoize data calculations to prevent unnecessary re-renders
  const displayData = useMemo(() =>
    isSearchMode ? searchResults : applications,
    [isSearchMode, searchResults, applications]
  );

  const displayLoading = useMemo(() =>
    isSearchMode ? isSearchLoading : isLoading,
    [isSearchMode, isSearchLoading, isLoading]
  );

  const getSerialNumber = useCallback((index: number) => {
    return (currentPage - 1) * limit + index + 1;
  }, [currentPage, limit]);

  const handleRowClick = useCallback((applicationId: string) => {
    const path = isSpouseApplication
      ? `/admin/spouse-skill-assessment-applications/${applicationId}`
      : `/admin/applications/${applicationId}`;
    router.push(path);
  }, [router, isSpouseApplication]);

  const resultCount = useMemo(() => searchResults.length, [searchResults.length]);

  if (displayLoading) {
    return <LoadingState />;
  }

  return (
    <div className='space-y-4'>
      <>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">S.No</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Handled By</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-center">Attachments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <EmptyState isSearchMode={isSearchMode} />
              ) : (
                displayData.map((application, index) => (
                  <TableRowComponent
                    key={application.id}
                    application={application}
                    index={index}
                    isSearchMode={isSearchMode}
                    getSerialNumber={getSerialNumber}
                    handleRowClick={handleRowClick}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </>
    </div>
  );
});