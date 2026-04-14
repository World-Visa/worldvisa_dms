"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import type { VisaApplication } from "@/types/applications";
import { APPLICATIONS_TABLE_COLUMNS } from "@/lib/constants/applicationsTable";
import { ApplicationTableRow } from "@/components/applications/applications-list/ApplicationTableRow";

interface ApplicationsTableProps {
  applications: VisaApplication[];
  currentPage: number;
  limit: number;
  isLoading?: boolean;
  isSearchMode?: boolean;
  searchResults?: VisaApplication[];
  isSearchLoading?: boolean;
  isSpouseApplication?: boolean;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const TableLoadingRow = memo(function TableLoadingRow() {
  return (
    <TableRow>
      {APPLICATIONS_TABLE_COLUMNS.map((col) => (
        <TableCell key={col.label} className={col.cellClassName}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
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
  totalCount,
  onPageChange,
  onPageSizeChange,
}: ApplicationsTableProps) {
  const router = useRouter();

  const columns = isSpouseApplication
    ? APPLICATIONS_TABLE_COLUMNS.filter((c) => c.label !== "Service")
    : APPLICATIONS_TABLE_COLUMNS;

  const columnCount = columns.length;

  const displayData = isSearchMode ? searchResults : applications;
  const displayLoading = isSearchMode ? isSearchLoading : isLoading;
  const totalPages =
    totalCount !== undefined ? Math.ceil(totalCount / limit) : 0;
  const showPagination =
    !isSearchMode && totalCount !== undefined && !!onPageChange;

  const handleRowClick = useCallback(
    (applicationId: string) => {
      const path = isSpouseApplication
        ? `/v2/spouse-skill-assessment-applications/${applicationId}`
        : `/v2/applications/${applicationId}`;
      router.push(path);
    },
    [router, isSpouseApplication],
  );

  return (
    <Table
      isLoading={displayLoading}
      loadingRowsCount={9}
      loadingRow={<TableLoadingRow />}
    >
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.label} className={col.headerClassName}>
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      {!displayLoading && (
        <TableBody>
          {displayData.map((application) => (
            <ApplicationTableRow
              key={application.id}
              application={application}
              onClick={handleRowClick}
              isSpouseApplication={isSpouseApplication}
            />
          ))}
        </TableBody>
      )}
      {showPagination && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={columnCount} className="p-0">
              <TablePaginationFooter
                pageSize={limit}
                currentPageItemsCount={displayData.length}
                totalCount={totalCount}
                hasPreviousPage={currentPage > 1}
                hasNextPage={currentPage < totalPages}
                onPreviousPage={() =>
                  onPageChange(Math.max(1, currentPage - 1))
                }
                onNextPage={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                onPageSizeChange={onPageSizeChange ?? (() => {})}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
});
