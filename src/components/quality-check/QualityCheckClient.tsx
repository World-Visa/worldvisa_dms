"use client";

import { memo, useEffect, useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { ListNoResults } from "@/components/applications/list-no-results";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button } from "@/components/ui/primitives/button";
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
import { QualityCheckViewSheet } from "./QualityCheckViewSheet";
import { useQualityCheckList } from "@/hooks/useQualityCheckList";
import { useDebounce } from "@/hooks/useDebounce";
import type { QualityCheckListItem } from "@/lib/api/qualityCheck";
import { QUALITY_CHECK_STATUS_OPTIONS, QUALITY_CHECK_RECORD_TYPE_OPTIONS } from "@/lib/constants/qualityCheck";
import { QUALITY_CHECK_TABLE_COLUMNS } from "@/lib/constants/qualityCheckTable";
import { QualityCheckTableRow } from "@/components/quality-check/QualityCheckTableRow";

interface Filters {
  status: "all" | "pending" | "reviewed" | "removed";
  recordType: "all" | "Visa_Applications" | "Spouse_Skill_Assessment";
}

const DEFAULT_FILTERS: Filters = { status: "all", recordType: "all" };

const DEFAULT_LIMIT = 10;

const TableLoadingRow = memo(function TableLoadingRow() {
  return (
    <TableRow>
      {QUALITY_CHECK_TABLE_COLUMNS.map((col) => (
        <TableCell key={col.label} className={col.cellClassName}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  );
});

export function QualityCheckClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawLeadId = searchParams.get("leadId");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedItem, setSelectedItem] = useState<QualityCheckListItem | null>(null);
  const [targetLeadId, setTargetLeadId] = useState<string | null>(null);

  // Phase 1: capture URL param and clear it immediately
  useEffect(() => {
    if (!rawLeadId) return;
    setTargetLeadId(rawLeadId);
    router.replace("/v2/quality-check", { scroll: false });
  }, [rawLeadId, router]);

  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  const isSearchMode = debouncedSearch.length > 0;

  const params = {
    page: currentPage,
    limit,
    search: debouncedSearch || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    recordType: filters.recordType !== "all" ? filters.recordType : undefined,
  };

  const { data, isLoading } = useQualityCheckList(params);

  const items = data?.data ?? [];
  const totalItems = data?.pagination?.totalRecords ?? data?.totalCount ?? 0;

  // Phase 2: once list loads, find item by leadId and open its sheet
  useEffect(() => {
    if (!targetLeadId || items.length === 0) return;
    const found = items.find((item) => item.id === targetLeadId);
    if (!found) return;
    setSelectedItem(found);
    setTargetLeadId(null);
  }, [targetLeadId, items]);

  const hasActiveFilters =
    searchInput.trim() !== "" ||
    filters.status !== "all" ||
    filters.recordType !== "all";

  const clearFilters = () => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const statusOptions = useMemo(
    () => [{ label: "All", value: "all" }, ...QUALITY_CHECK_STATUS_OPTIONS],
    [],
  );

  const recordTypeOptions = useMemo(
    () => [{ label: "All", value: "all" }, ...QUALITY_CHECK_RECORD_TYPE_OPTIONS],
    [],
  );

  return (
    <main className="w-full">
      <div className="mb-3">
        <h1 className="text-xl text-foreground">Quality Check</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-2.5">
        <FacetedFormFilter
          type="text"
          size="small"
          title="Search"
          value={searchInput}
          onChange={(v) => {
            setSearchInput(v);
            setCurrentPage(1);
          }}
          placeholder="Search by name/email…"
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Status"
          options={statusOptions}
          selected={filters.status !== "all" ? [filters.status] : []}
          onSelect={(vals) => {
            setFilters((prev) => ({ ...prev, status: (vals[0] as Filters["status"]) ?? "all" }));
            setCurrentPage(1);
          }}
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Record Type"
          options={recordTypeOptions}
          selected={filters.recordType !== "all" ? [filters.recordType] : []}
          onSelect={(vals) => {
            setFilters((prev) => ({
              ...prev,
              recordType: (vals[0] as Filters["recordType"]) ?? "all",
            }));
            setCurrentPage(1);
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

      <div className="space-y-4 mt-2">
        {!isLoading && items.length === 0 ? (
          <div className="py-16 h-[calc(60vh-200px)] flex items-center justify-center">
            <ListNoResults
              title={isSearchMode ? "No results" : "No quality check applications"}
              description={
                isSearchMode
                  ? "No quality check applications match your search."
                  : "Quality check applications will appear here."
              }
              onClearFilters={hasActiveFilters ? clearFilters : undefined}
            />
          </div>
        ) : (
          <div className="w-full">
            <Table
              isLoading={isLoading}
              loadingRowsCount={8}
              loadingRow={<TableLoadingRow />}
            >
              <TableHeader>
                <TableRow>
                  {QUALITY_CHECK_TABLE_COLUMNS.map((col) => (
                    <TableHead key={col.label} className={col.headerClassName}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              {!isLoading && (
                <TableBody>
                  {items.map((item) => (
                    <QualityCheckTableRow
                      key={`${item.qcId}-${item.id}`}
                      item={item}
                      searchQuery={isSearchMode ? debouncedSearch : ""}
                      onView={setSelectedItem}
                    />
                  ))}
                </TableBody>
              )}

              {totalItems > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={QUALITY_CHECK_TABLE_COLUMNS.length} className="p-0">
                      <TablePaginationFooter
                        pageSize={limit}
                        currentPageItemsCount={items.length}
                        totalCount={totalItems}
                        hasPreviousPage={currentPage > 1}
                        hasNextPage={currentPage < Math.max(1, Math.ceil(totalItems / limit))}
                        onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        onNextPage={() =>
                          setCurrentPage((p) =>
                            Math.min(Math.max(1, Math.ceil(totalItems / limit)), p + 1),
                          )
                        }
                        onPageSizeChange={(size) => {
                          setLimit(size);
                          setCurrentPage(1);
                        }}
                        pageSizeOptions={[10, 20, 50]}
                      />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        )}
      </div>

      <QualityCheckViewSheet
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </main>
  );
}
