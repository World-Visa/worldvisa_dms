"use client";

import * as React from "react";
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
import { AlertCircle, RefreshCw, Search, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/v2/datatable/data-table";
import { DataTablePagination } from "@/components/v2/datatable/data-table-pagination";
import { DataTableViewOptions } from "@/components/v2/datatable/data-table-view-options";
import { useClients, type ClientRecord } from "@/hooks/useClients";
import { useAdminUsers } from "@/hooks/useAdminUsers";

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

function EmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>No Clients Found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filter criteria.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function ClientsManageClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [leadOwnerFilter, setLeadOwnerFilter] = React.useState("all");

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleLeadOwnerChange = (value: string) => {
    setLeadOwnerFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useClients({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    lead_owner: leadOwnerFilter === "all" ? undefined : leadOwnerFilter,
  });

  // Fetch admin users for the lead_owner filter dropdown
  const { data: adminUsers } = useAdminUsers();

  const clients: ClientRecord[] = data?.data?.clients ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalRecords = data?.pagination?.totalRecords ?? 0;

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

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">Manage Clients</h1>
          {!isLoading && !isError && (
            <p className="text-muted-foreground text-sm">
              {totalRecords} {totalRecords === 1 ? "client" : "clients"} total
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={leadOwnerFilter} onValueChange={handleLeadOwnerChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {adminUsers?.map((user) => (
              <SelectItem key={user._id} value={user.username}>
                <span className="capitalize">{user.username}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="size-9"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <DataTableViewOptions table={table} />
        </div>
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
      <div className="overflow-hidden rounded-md border">
        {isLoading ? (
          <TableSkeleton />
        ) : clients.length === 0 && !isError ? (
          <EmptyState />
        ) : (
          <DataTable table={table} columns={clientColumns} />
        )}
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {selectedCount} of {totalRecords} row(s) selected.
        </p>
        <div className="[&>div>div:first-child]:hidden!">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
