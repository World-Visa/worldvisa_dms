"use client";

import { useMemo } from "react";
import { PaginationParams } from "@/types/common";

interface UsePaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  siblingCount?: number;
}

interface PaginationResult {
  paginationRange: (number | string)[];
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: number | null;
  prevPage: number | null;
  startIndex: number;
  endIndex: number;
}

export function usePagination({
  total,
  currentPage,
  pageSize,
  siblingCount = 1,
}: UsePaginationProps): PaginationResult {
  const totalPages = Math.ceil(total / pageSize);

  const paginationRange = useMemo(() => {
    const range: (number | string)[] = [];

    // Always show first page
    range.push(1);

    // Calculate start and end of middle range
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Show ellipsis if there's a gap between first page and left sibling
    if (leftSiblingIndex > 2) {
      range.push("...");
    }

    // Show middle range
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }

    // Show ellipsis if there's a gap between right sibling and last page
    if (rightSiblingIndex < totalPages - 1) {
      range.push("...");
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages, siblingCount]);

  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;
  const nextPage = hasNext ? currentPage + 1 : null;
  const prevPage = hasPrev ? currentPage - 1 : null;

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  return {
    paginationRange,
    totalPages,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
  };
}

// Hook for pagination parameters
export function usePaginationParams(
  defaultPageSize: number = 10,
): PaginationParams & {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (sort: string) => void;
  setOrder: (order: "asc" | "desc") => void;
} {
  // This would typically use URL search params or state management
  // For now, returning a basic implementation
  return {
    page: 1,
    limit: defaultPageSize,
    sort: undefined,
    order: undefined,
    setPage: () => {},
    setPageSize: () => {},
    setSort: () => {},
    setOrder: () => {},
  };
}
