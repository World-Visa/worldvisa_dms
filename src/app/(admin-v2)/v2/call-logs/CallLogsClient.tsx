"use client";

import { memo, useState } from "react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useCallLogs } from "@/hooks/useCallLogs";
import { useCallLogRealtime } from "@/hooks/useCallLogRealtime";
import { useDebounce } from "@/hooks/useDebounce";
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
import { Skeleton } from "@/components/ui/skeleton";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button } from "@/components/ui/primitives/button";
import { ListNoResults } from "@/components/applications/list-no-results";
import { CallLogTableRow } from "@/components/call-logs/CallLogTableRow";
import { CallLogDetailModal } from "@/components/call-logs/CallLogDetailModal";
import { CALL_LOGS_TABLE_COLUMNS } from "@/lib/constants/callLogsTable";
import {
  CALL_STATUS_OPTIONS,
  CALL_DIRECTION_OPTIONS,
  DATE_RANGE_OPTIONS,
} from "@/lib/constants/callLogs";
import type { CallLog, CallStatus, CallDirection, DateRangePreset } from "@/types/callLog";

const TableLoadingRow = memo(function TableLoadingRow() {
  return (
    <TableRow>
      {CALL_LOGS_TABLE_COLUMNS.map((col) => (
        <TableCell key={col.label} className={col.cellClassName}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  );
});

export function CallLogsClient() {
  // ── URL-synced filter state (nuqs) ─────────────────────────────────────────
  const [search,    setSearch]    = useQueryState("q",         parseAsString.withDefault(""));
  const [status,    setStatus]    = useQueryState("status",    parseAsString.withDefault(""));
  const [direction, setDirection] = useQueryState("direction", parseAsString.withDefault(""));
  const [dateRange, setDateRange] = useQueryState("dateRange", parseAsString.withDefault(""));
  const [page,      setPage]      = useQueryState("page",      parseAsInteger.withDefault(1));
  const [limit,     setLimit]     = useQueryState("limit",     parseAsInteger.withDefault(20));

  // ── Ephemeral UI state ─────────────────────────────────────────────────────
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const debouncedSearch = useDebounce(search.trim(), 350);

  const { data, isLoading } = useCallLogs({
    q:         debouncedSearch || undefined,
    status:    (status as CallStatus)    || undefined,
    direction: (direction as CallDirection) || undefined,
    dateRange: (dateRange as DateRangePreset) || undefined,
    page,
    limit,
  });

  // Mount once — socket events keep the React Query cache fresh
  useCallLogRealtime();

  // ── Derived ────────────────────────────────────────────────────────────────
  const callLogs  = data?.data?.callLogs ?? [];
  const pagination = data?.pagination;

  const hasActiveFilters = Boolean(search || status || direction || dateRange);

  const clearFilters = () => {
    void setSearch("");
    void setStatus("");
    void setDirection("");
    void setDateRange("");
    void setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    void setLimit(size);
    void setPage(1);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="w-full">
      {/* Page title */}
      <div className="mb-3">
        <h1 className="text-xl text-foreground">Call Logs</h1>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2 py-2.5">
        <FacetedFormFilter
          type="text"
          size="small"
          title="Search"
          value={search}
          onChange={(v) => {
            void setSearch(v);
            void setPage(1);
          }}
          placeholder="Phone, agent, client…"
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Status"
          options={CALL_STATUS_OPTIONS}
          selected={status ? [status] : []}
          onSelect={(vals) => {
            void setStatus(vals[0] ?? "");
            void setPage(1);
          }}
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Direction"
          options={CALL_DIRECTION_OPTIONS}
          selected={direction ? [direction] : []}
          onSelect={(vals) => {
            void setDirection(vals[0] ?? "");
            void setPage(1);
          }}
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Date Range"
          options={DATE_RANGE_OPTIONS}
          selected={dateRange ? [dateRange] : []}
          onSelect={(vals) => {
            void setDateRange(vals[0] ?? "");
            void setPage(1);
          }}
        />
        {hasActiveFilters && (
          <Button
            variant="secondary"
            mode="ghost"
            size="2xs"
            className="text-xs! font-normal! text-neutral-700"
            onClick={clearFilters}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="mt-2 w-full">
        {!isLoading && callLogs.length === 0 ? (
          <div className="flex h-[calc(60vh-200px)] items-center justify-center py-16">
            <ListNoResults
              title="No call logs found"
              description="Call logs will appear here once calls are made or received."
              onClearFilters={hasActiveFilters ? clearFilters : undefined}
            />
          </div>
        ) : (
          <Table
            isLoading={isLoading}
            loadingRowsCount={8}
            loadingRow={<TableLoadingRow />}
          >
            <TableHeader>
              <TableRow>
                {CALL_LOGS_TABLE_COLUMNS.map((col) => (
                  <TableHead key={col.label} className={col.headerClassName}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            {!isLoading && (
              <TableBody>
                {callLogs.map((log) => (
                  <CallLogTableRow
                    key={log._id}
                    log={log}
                    onView={setSelectedLog}
                  />
                ))}
              </TableBody>
            )}

            {pagination && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={CALL_LOGS_TABLE_COLUMNS.length} className="p-0">
                    <TablePaginationFooter
                      pageSize={limit}
                      currentPageItemsCount={callLogs.length}
                      totalCount={pagination.totalRecords}
                      hasPreviousPage={pagination.currentPage > 1}
                      hasNextPage={pagination.currentPage < pagination.totalPages}
                      onPreviousPage={() => void setPage(Math.max(1, page - 1))}
                      onNextPage={() => void setPage(Math.min(pagination.totalPages, page + 1))}
                      onPageSizeChange={handlePageSizeChange}
                      pageSizeOptions={[10, 20, 50]}
                    />
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </div>

      {/* Detail modal */}
      <CallLogDetailModal
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </main>
  );
}
