"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlidersHorizontal, CircleDot, UserPlus, UserCheck } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { cn } from "@/lib/utils";

export interface RequestedDocumentsFilters {
  search: string;
  status: string;
  priority: string;
  requestedBy: string;
  requestedTo: string;
}

interface RequestedDocumentsFiltersProps {
  filters: RequestedDocumentsFilters;
  onFiltersChange: (filters: RequestedDocumentsFilters) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalCount?: number;
  filteredCount?: number;
}

export function RequestedDocumentsFilters({
  filters,
  onFiltersChange,
}: RequestedDocumentsFiltersProps) {
  const { data: adminUsers = [], isLoading: isLoadingUsers } = useAdminUsers();

  const hasActiveFilters =
    filters.status !== "all" ||
    Boolean(filters.requestedBy) ||
    Boolean(filters.requestedTo);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.requestedBy) count++;
    if (filters.requestedTo) count++;
    return count;
  }, [filters.status, filters.requestedBy, filters.requestedTo]);

  const handleFilterChange = (
    key: keyof RequestedDocumentsFilters,
    value: string,
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      priority: "",
      requestedBy: "",
      requestedTo: "",
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-2 rounded-lg px-3.5 text-sm font-medium transition-all",
            hasActiveFilters
              ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[400px] overflow-hidden rounded-xl border border-border/80 p-0 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Filters
            </span>
            {activeFilterCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Sections */}
        <div className="max-h-[520px] divide-y divide-border/60 overflow-y-auto">
          {/* Status */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </span>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="h-9 w-full rounded-md">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="all" className="rounded-md py-2 text-sm">
                  All Status
                </SelectItem>
                <SelectItem value="pending" className="rounded-md py-2 text-sm">
                  Pending
                </SelectItem>
                <SelectItem value="reviewed" className="rounded-md py-2 text-sm">
                  Reviewed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requested By */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Requested By
              </span>
            </div>
            <Select
              value={filters.requestedBy || "all"}
              onValueChange={(v) =>
                handleFilterChange("requestedBy", v === "all" ? "" : v)
              }
              disabled={isLoadingUsers}
            >
              <SelectTrigger className="h-9 w-full rounded-md">
                <SelectValue
                  placeholder={isLoadingUsers ? "Loading..." : "All users"}
                />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="all" className="rounded-md py-2 text-sm">
                  All users
                </SelectItem>
                {adminUsers.map((u) => (
                  <SelectItem
                    key={u._id}
                    value={u.username}
                    className="rounded-md py-2 text-sm"
                  >
                    {u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requested To */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Requested To
              </span>
            </div>
            <Select
              value={filters.requestedTo || "all"}
              onValueChange={(v) =>
                handleFilterChange("requestedTo", v === "all" ? "" : v)
              }
              disabled={isLoadingUsers}
            >
              <SelectTrigger className="h-9 w-full rounded-md">
                <SelectValue
                  placeholder={isLoadingUsers ? "Loading..." : "All users"}
                />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-lg">
                <SelectItem value="all" className="rounded-md py-2 text-sm">
                  All users
                </SelectItem>
                {adminUsers.map((u) => (
                  <SelectItem
                    key={u._id}
                    value={u.username}
                    className="rounded-md py-2 text-sm"
                  >
                    {u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
