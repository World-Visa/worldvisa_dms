"use client";

import { memo, useCallback, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { ListNoResults } from "@/components/applications/list-no-results";
import { InvitedClientTableRow } from "@/components/v2/invitations/InvitedClientTableRow";
import { useClients, type ClientRecord } from "@/hooks/useClients";
import { INVITED_CLIENTS_TABLE_COLUMNS } from "@/lib/constants/invitedClientsTable";

const COLUMN_COUNT = INVITED_CLIENTS_TABLE_COLUMNS.length;

const TableLoadingRow = memo(function TableLoadingRow() {
  return (
    <TableRow>
      {INVITED_CLIENTS_TABLE_COLUMNS.map((col) => (
        <TableCell key={col.label} className={col.cellClassName}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  );
});

export function InvitedClientsClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, error, refetch } = useClients({
    page: currentPage,
    limit: pageSize,
    invited: true,
  });

  const clients: ClientRecord[] = data?.data?.clients ?? [];
  const totalRecords = data?.pagination?.totalRecords ?? 0;
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load invitations."}{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-destructive"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isLoading && clients.length === 0) {
    return (
      <div className="py-16 h-[calc(60vh-200px)] flex items-center justify-center">
        <ListNoResults
          title="No Pending Invitations"
          description="Invited clients will appear here until they accept and complete registration."
        />
      </div>
    );
  }

  return (
    <Table
      isLoading={isLoading}
      loadingRowsCount={8}
      loadingRow={<TableLoadingRow />}
    >
      <TableHeader>
        <TableRow>
          {INVITED_CLIENTS_TABLE_COLUMNS.map((col) => (
            <TableHead key={col.label} className={col.headerClassName}>
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      {!isLoading && (
        <TableBody>
          {clients.map((client) => (
            <InvitedClientTableRow key={client._id} client={client} />
          ))}
        </TableBody>
      )}
      <TableFooter>
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT} className="p-0">
            <TablePaginationFooter
              pageSize={pageSize}
              currentPageItemsCount={clients.length}
              totalCount={totalRecords}
              hasPreviousPage={currentPage > 1}
              hasNextPage={currentPage < totalPages}
              onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 20, 50]}
            />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
