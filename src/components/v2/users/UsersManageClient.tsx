"use client";

import { memo, useEffect, useMemo, useState } from "react";
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
import {
  useAdminUsersV2,
  type AdminUserV2,
  type AdminUsersV2Response,
} from "@/hooks/useAdminUsersV2";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button as PrimitiveButton } from "@/components/ui/primitives/button";
import { ROLE_OPTIONS } from "@/lib/constants/users";
import { useAuth } from "@/hooks/useAuth";

import { UserTableRow } from "@/components/v2/users/UserTableRow";
import { USERS_TABLE_COLUMNS } from "@/lib/constants/usersTable";

const ROLE_FILTER_OPTIONS = ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }));
const COLUMN_COUNT = USERS_TABLE_COLUMNS.length;

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

const TableLoadingRow = memo(function TableLoadingRow() {
  return (
    <TableRow>
      {USERS_TABLE_COLUMNS.map((col) => (
        <TableCell key={col.label} className={col.cellClassName}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  );
});

interface UsersManageClientProps {
  initialData?: AdminUsersV2Response;
}

export function UsersManageClient({ initialData }: UsersManageClientProps) {
  const { user: currentUser } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = {
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch || undefined,
    role: roleFilter[0] || undefined,
  };

  const { data, isLoading, isError, error, refetch } = useAdminUsersV2(queryParams);

  const isDefaultParams = queryParams.page === 1 && !queryParams.search && !queryParams.role;
  const resolvedData = data ?? (isDefaultParams ? initialData : undefined);
  const showLoading = isLoading && !resolvedData;

  const users: AdminUserV2[] = useMemo(() => {
    const raw = resolvedData?.data?.users ?? [];
    if (!currentUser?._id) return raw;
    return raw.map((u) =>
      u._id === currentUser._id ? { ...u, online_status: true } : u,
    );
  }, [resolvedData?.data?.users, currentUser?._id]);
  
  const totalPages = Math.max(1, resolvedData?.pagination?.totalPages ?? 1);
  const totalRecords = resolvedData?.pagination?.totalRecords ?? 0;

  const hasActiveFilters = searchInput.trim() !== "" || roleFilter.length > 0;

  const clearFilters = () => {
    setSearchInput("");
    setRoleFilter([]);
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
            setCurrentPage(1);
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

      {/* Empty */}
      {!showLoading && !isError && users.length === 0 && (
        <div className="py-16 h-[calc(60vh-200px)] flex items-center justify-center">
          <ListNoResults
            title="No Users Found"
            description="Try adjusting your search or filter criteria."
            onClearFilters={hasActiveFilters ? clearFilters : undefined}
          />
        </div>
      )}

      {/* Table */}
      {(showLoading || users.length > 0) && (
        <Table isLoading={showLoading} loadingRowsCount={8} loadingRow={<TableLoadingRow />}>
          <TableHeader>
            <TableRow>
              {USERS_TABLE_COLUMNS.map((col) => (
                <TableHead key={col.label} className={col.headerClassName}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {!showLoading && (
            <TableBody>
              {users.map((user) => (
                <UserTableRow key={user._id} user={user} />
              ))}
            </TableBody>
          )}

          <TableFooter>
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="p-0">
                <TablePaginationFooter
                  pageSize={pageSize}
                  currentPageItemsCount={users.length}
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
