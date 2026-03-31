"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Users } from "lucide-react";
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
import {
  useAdminUsersV2,
  type AdminUserV2,
  type AdminUsersV2Response,
} from "@/hooks/useAdminUsersV2";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button as PrimitiveButton } from "@/components/ui/primitives/button";
import { ROLE_OPTIONS } from "@/lib/constants/users";
import { useAuth } from "@/hooks/useAuth";

import { userColumns } from "./columns.users";

const ROLE_FILTER_OPTIONS = ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }));

export function TableSkeleton() {
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

interface UsersManageClientProps {
  initialData?: AdminUsersV2Response;
}

export function UsersManageClient({ initialData }: UsersManageClientProps) {
  const { user: currentUser } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    role: roleFilter[0] || undefined,
  };

  const { data, isLoading, isError, error, refetch } = useAdminUsersV2(queryParams);

  const isDefaultParams = queryParams.page === 1 && !queryParams.search && !queryParams.role;
  const resolvedData = data ?? (isDefaultParams ? initialData : undefined);

  const users: AdminUserV2[] = useMemo(() => {
    const raw = resolvedData?.data?.users ?? [];
    if (!currentUser?._id) return raw;
    return raw.map((u) =>
      u._id === currentUser._id ? { ...u, online_status: true } : u,
    );
  }, [resolvedData?.data?.users, currentUser?._id]);
  
  const totalPages = resolvedData?.pagination?.totalPages ?? 1;
  const totalRecords = resolvedData?.pagination?.totalRecords ?? 0;

  const table = useReactTable({
    data: users,
    columns: userColumns,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    manualPagination: true,
    pageCount: totalPages,
    getRowId: (row) => row._id,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const hasActiveFilters = searchInput.trim() !== "" || roleFilter.length > 0;

  const clearFilters = () => {
    setSearchInput("");
    setRoleFilter([]);
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
          placeholder="Search users…"
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Role"
          options={ROLE_FILTER_OPTIONS}
          selected={roleFilter}
          onSelect={(vals) => {
            setRoleFilter(vals);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
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

      {/* Error state */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load users."}{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-destructive"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        {isLoading && !resolvedData ? (
          <div className="py-4">
            <TableSkeleton />
          </div>
        ) : users.length === 0 && !isError ? (
          <EmptyState />
        ) : (
          <DataTable table={table} columns={userColumns} />
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Total {totalRecords} row(s).
        </p>
        <div className="[&>div>div:first-child]:hidden!">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
