'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface ApplicationsPaginationProps {
  currentPage: number;
  totalRecords: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function ApplicationsPagination({
  currentPage,
  totalRecords,
  limit,
  onPageChange,
}: ApplicationsPaginationProps) {
  const {
    paginationRange,
    totalPages,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
  } = usePagination({
    total: totalRecords,
    currentPage,
    pageSize: limit,
  });

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col px-4 py-2 gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Results info */}
      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        Showing {startIndex} to {endIndex} of {totalRecords} results
      </div>
      
      {/* Pagination controls */}
      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => prevPage && onPageChange(prevPage)}
          disabled={!hasPrev}
          className="flex items-center gap-1 px-2 sm:px-3"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline sm:inline">Previous</span>
          <span className="xs:hidden">Prev</span>
        </Button>
        
        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {paginationRange.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-1 sm:px-2 py-1 text-xs sm:text-sm text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => nextPage && onPageChange(nextPage)}
          disabled={!hasNext}
          className="flex items-center gap-1 px-2 sm:px-3"
        >
          <span className="hidden xs:inline sm:inline">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
