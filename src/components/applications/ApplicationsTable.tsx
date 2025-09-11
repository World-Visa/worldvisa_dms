'use client';

import React, { useEffect, useRef } from 'react';
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
import { gsap } from 'gsap';
import { formatDate } from '@/utils/format';

interface ApplicationsTableProps {
  applications: VisaApplication[];
  currentPage: number;
  limit: number;
  isLoading?: boolean;
  isSearchMode?: boolean;
  searchResults?: VisaApplication[];
  isSearchLoading?: boolean;
}

export function ApplicationsTable({
  applications,
  currentPage,
  limit,
  isLoading = false,
  isSearchMode = false,
  searchResults = [],
  isSearchLoading = false,
}: ApplicationsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Determine which data to display
  const displayData = isSearchMode ? searchResults : applications;
  const displayLoading = isSearchMode ? isSearchLoading : isLoading;

  const getSerialNumber = (index: number) => {
    return (currentPage - 1) * limit + index + 1;
  };

  const handleRowClick = (applicationId: string) => {
    router.push(`/admin/applications/${applicationId}`);
  };

  useEffect(() => {
    if (tableRef.current && displayData.length > 0) {
      const rows = tableRef.current.querySelectorAll('tbody tr');
      
      // Set initial state
      gsap.set(rows, { opacity: 0, y: 20 });
      
      // Animate rows in
      gsap.to(rows, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [displayData, currentPage]);

  if (displayLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card key={isSearchMode ? 'search-results' : 'applications'}>
      <CardHeader>
        <CardTitle>
          {isSearchMode ? 'Search Results' : 'Applications'}
          {isSearchMode && searchResults.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({searchResults.length} result{searchResults.length !== 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={tableRef}>
          <Table key={isSearchMode ? 'search-results' : 'applications'}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">S.No</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-center">Attachments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isSearchMode ? 'No search results found' : 'No applications found'}
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((application, index) => (
                  <TableRow 
                    key={application.id} 
                    className='cursor-pointer hover:bg-muted/50 transition-colors'
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
                      {application.Created_Time ? formatDate(application.Created_Time, 'time') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className='bg-green-600 text-white'>
                        {application.AttachmentCount}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
