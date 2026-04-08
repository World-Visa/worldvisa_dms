"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
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
import { useClients, type ClientRecord } from "@/hooks/useClients";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button as PrimitiveButton } from "@/components/ui/primitives/button";

import { ClientTableRow } from "@/components/v2/clients/ClientTableRow";
import { CLIENTS_TABLE_COLUMNS } from "@/lib/constants/clientsTable";

const COLUMN_COUNT = CLIENTS_TABLE_COLUMNS.length;

const TableLoadingRow = memo(function TableLoadingRow() {
  return (
    <TableRow>
      {CLIENTS_TABLE_COLUMNS.map((col) => (
        <TableCell key={col.label} className={col.cellClassName}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  );
});

interface ClientsManageClientProps {
  invited?: boolean;
}

export function ClientsManageClient({ invited }: ClientsManageClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [leadOwner, setLeadOwner] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const rawDebounced = useDebounce(searchInput.trim(), 300);
  const debouncedSearch = rawDebounced.length >= 2 ? rawDebounced : "";

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data: adminUsers, isLoading: isLoadingAdmins } = useAdminUsers();

  const adminOptions = useMemo(
    () =>
      (adminUsers ?? [])
        .map((u) => ({ value: u.username ?? "", label: u.username ?? "" }))
        .filter((o) => o.value),
    [adminUsers],
  );

  const { data, isLoading, isError, error, refetch } = useClients({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch || undefined,
    lead_owner: leadOwner[0] || undefined,
    invited: invited || undefined,
  });

  const showLoading = isLoading && !data;
  const clients: ClientRecord[] = data?.data?.clients ?? [];
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1);
  const totalRecords = data?.pagination?.totalRecords ?? 0;

  const hasActiveFilters = debouncedSearch !== "" || leadOwner.length > 0;

  const clearFilters = () => {
    setSearchInput("");
    setLeadOwner([]);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <FacetedFormFilter
          type="text"
          size="small"
          title="Search"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search clients…"
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Lead Owner"
          options={adminOptions}
          selected={leadOwner}
          onSelect={(vals) => {
            setLeadOwner(vals);
            setCurrentPage(1);
          }}
          isLoading={isLoadingAdmins}
        />
        {hasActiveFilters && (
          <PrimitiveButton
            variant="secondary"
            mode="ghost"
            size="2xs"
            className="text-xs! font-normal! text-neutral-700"
            onClick={clearFilters}
          >
            Reset
          </PrimitiveButton>
        )}
      </div>

      {/* Error */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load clients."}{" "}
            <Button variant="link" className="h-auto p-0 text-destructive" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty */}
      {!showLoading && !isError && clients.length === 0 && (
        <div className="py-16 h-[calc(60vh-200px)] flex items-center justify-center">
          <ListNoResults
            title={invited ? "No Invitations Found" : "No Clients Found"}
            description={
              invited
                ? "Invitations will appear here until they accept and complete registration."
                : "Try adjusting your search or filter criteria."
            }
            onClearFilters={hasActiveFilters ? clearFilters : undefined}
          />
        </div>
      )}

      {/* Table */}
      {(showLoading || clients.length > 0) && (
        <Table isLoading={showLoading} loadingRowsCount={8} loadingRow={<TableLoadingRow />}>
          <TableHeader>
            <TableRow>
              {CLIENTS_TABLE_COLUMNS.map((col) => (
                <TableHead key={col.label} className={col.headerClassName}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {!showLoading && (
            <TableBody>
              {clients.map((client) => (
                <ClientTableRow key={client._id} client={client} />
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
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </div>
  );
}
