"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Mail, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/v2/datatable/data-table";
import { DataTablePagination } from "@/components/v2/datatable/data-table-pagination";
import { useClients, type ClientRecord } from "@/hooks/useClients";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button as PrimitiveButton } from "@/components/ui/primitives/button";

import { clientColumns } from "./columns.clients";

function TableSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ invited }: { invited?: boolean }) {
  const title = invited ? "No Invitations Found" : "No Clients Found";
  const description = invited
    ? "Invitations will appear here until they accept and complete registration."
    : "Try adjusting your search or filter criteria.";

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {invited ? <Mail className="size-6" /> : <Users className="size-6" />}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

interface ClientsManageClientProps {
  invited?: boolean;
}

export function ClientsManageClient({ invited }: ClientsManageClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [leadOwner, setLeadOwner] = useState<string[]>([]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: adminUsers, isLoading: isLoadingAdmins } = useAdminUsers();

  const adminOptions = useMemo(
    () =>
      (adminUsers ?? [])
        .map((u) => ({ value: u.username ?? "", label: u.username ?? "" }))
        .filter((o) => o.value),
    [adminUsers],
  );

  const { data, isLoading, isError, error, refetch } = useClients({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    lead_owner: leadOwner[0] || undefined,
    invited: invited || undefined,
  });

  const clients: ClientRecord[] = data?.data?.clients ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const table = useReactTable({
    data: clients,
    columns: clientColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
    },
    manualPagination: true,
    pageCount: totalPages,
    enableRowSelection: true,
    getRowId: (row) => row._id,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  const hasActiveFilters = searchInput.trim() !== "" || leadOwner.length > 0;

  const clearFilters = () => {
    setSearchInput("");
    setLeadOwner([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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

      {/* Table */}
      <div className="overflow-hidden rounded-md">
        {isLoading ? (
          <TableSkeleton />
        ) : clients.length === 0 && !isError ? (
          <EmptyState invited={invited} />
        ) : (
          <DataTable table={table} columns={clientColumns} />
        )}
      </div>

      {/* Pagination footer */}
      {clients.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {selectedCount} of {clients.length} row(s) selected.
          </p>
          <div className="[&>div>div:first-child]:hidden!">
            <DataTablePagination table={table} />
          </div>
        </div>
      )}
    </div>
  );
}
