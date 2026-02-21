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
import { useAdminUsersV2, type AdminUserV2 } from "@/hooks/useAdminUsersV2";

import { AddUserDialog } from "./AddUserDialog";
import { userColumns } from "./columns.users";

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "master_admin", label: "Master Admin" },
  { value: "admin", label: "Admin" },
  { value: "team_leader", label: "Team Leader" },
  { value: "supervisor", label: "Supervisor" },
];

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-8 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
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
        <EmptyTitle>No Users Found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filter criteria.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function UsersManageClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 on role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminUsersV2({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    role: roleFilter === "all" ? undefined : roleFilter,
    search: debouncedSearch || undefined,
  });

  const users: AdminUserV2[] = data?.data?.users ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalRecords = data?.pagination?.totalRecords ?? 0;

  const table = useReactTable({
    data: users,
    columns: userColumns,
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
          <h1 className="text-2xl tracking-tight">Manage Users</h1>
        </div>
        <AddUserDialog />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load users."}{" "}
            <Button variant="link" className="h-auto p-0 text-destructive" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        {isLoading ? (
          <div className="py-4">
            <TableSkeleton />
          </div>
        ) : users.length === 0 && !isError ? (
          <EmptyState />
        ) : (
          <DataTable table={table} columns={userColumns} />
        )}
      </div>

      {/* Pagination footer — hide the built-in selected-row count from DataTablePagination */}
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
