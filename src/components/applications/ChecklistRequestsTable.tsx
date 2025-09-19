'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
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
import { Button } from '@/components/ui/button';
import { ChecklistRequestItem } from '@/lib/api/checklistRequests';
import { gsap } from 'gsap';
import { Eye, FileText } from 'lucide-react';

interface ChecklistRequestsTableProps {
  requests: ChecklistRequestItem[];
  currentPage: number;
  limit: number;
  isLoading?: boolean;
}

export const ChecklistRequestsTable = memo(function ChecklistRequestsTable({
  requests,
  currentPage,
  limit,
  isLoading = false,
}: ChecklistRequestsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Filter out empty or invalid records
  const validRequests = requests ? requests.filter(req => req.id && req.id.trim() !== '' && req.Checklist_Requested === true) : [];

  const getSerialNumber = useCallback((index: number) => {
    return (currentPage - 1) * limit + index + 1;
  }, [currentPage, limit]);

  const handleRowClick = useCallback((applicationId: string) => {
    router.push(`/admin/applications/${applicationId}`);
  }, [router]);


  useEffect(() => {
    if (tableRef.current && requests.length > 0) {
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
  }, [requests, currentPage]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Checklist Requests
          </CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Checklist Requests
          <Badge variant="secondary" className="ml-2">
            {validRequests.length} request{validRequests.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={tableRef}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <p>No checklist requests found</p>
                      <p className="text-sm text-gray-500">
                        Applications that request checklists will appear here
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                validRequests.map((request, index) => (
                  <TableRow 
                    key={request.id} 
                    className='cursor-pointer hover:bg-muted/50 transition-colors'
                    onClick={() => handleRowClick(request.id)}
                  >
                    <TableCell className="font-medium">
                      {getSerialNumber(index)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.Name}
                    </TableCell>
                    <TableCell>
                      {request.Email}
                    </TableCell>
                    <TableCell>
                      {request.Phone}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(request.id);
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
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
});
