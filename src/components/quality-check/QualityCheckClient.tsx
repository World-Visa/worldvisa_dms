"use client";

import React, { useState, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QualityCheckDataTable } from "./QualityCheckDataTable";
import { QualityCheckViewSheet } from "./QualityCheckViewSheet";
import { useQualityCheckList } from "@/hooks/useQualityCheckList";
import { useDebounce } from "@/hooks/useDebounce";
import type { QualityCheckListItem } from "@/lib/api/qualityCheck";

interface Filters {
  status: string;
  recordType: string;
}

const DEFAULT_FILTERS: Filters = { status: "all", recordType: "all" };
const LIMIT = 10;

export function QualityCheckClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedItem, setSelectedItem] = useState<QualityCheckListItem | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const debouncedSearch = useDebounce(search.trim(), 350);

  const params = {
    page,
    limit: LIMIT,
    search: debouncedSearch || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    recordType: filters.recordType !== "all" ? filters.recordType : undefined,
  };

  const { data, isLoading } = useQualityCheckList(params);

  const items = data?.data ?? [];
  const totalItems = data?.pagination?.totalRecords ?? data?.totalCount ?? 0;

  const activeFilterCount = [
    filters.status !== "all",
    filters.recordType !== "all",
  ].filter(Boolean).length;

  const handleRowClick = useCallback((item: QualityCheckListItem) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
    setSelectedItem(null);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );

  return (
    <main>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground">
              Quality Check
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Review and manage quality check applications.
            </p>
          </div>
          <div className="text-sm text-muted-foreground tabular-nums">
            {isLoading ? (
              <span className="animate-pulse">—</span>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {totalItems.toLocaleString()}
                </span>
                <span className="ml-1">applications</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name..."
            className="pl-9 h-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Status
                </Label>
                <Select
                  value={filters.status}
                  onValueChange={(v) => handleFilterChange("status", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="removed">Removed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Record Type
                </Label>
                <Select
                  value={filters.recordType}
                  onValueChange={(v) => handleFilterChange("recordType", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="Visa_Applications">
                      Visa Applications
                    </SelectItem>
                    <SelectItem value="Spouse_Skill_Assessment">
                      Spouse Skill Assessment
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Data table */}
      <QualityCheckDataTable
        items={items}
        isLoading={isLoading}
        totalItems={totalItems}
        currentPage={page}
        limit={LIMIT}
        searchQuery={debouncedSearch}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
      />

      {/* Sheet */}
      <QualityCheckViewSheet
        item={selectedItem}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
      />
    </main>
  );
}
