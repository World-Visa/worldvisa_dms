"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, RefreshCw } from "lucide-react";
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
  onRefresh,
  isRefreshing = false,
  totalCount = 0,
  filteredCount = 0,
}: RequestedDocumentsFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

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
      status: "",
      priority: "",
      requestedBy: "",
      requestedTo: "",
    });
  };

  // const getActiveFiltersCount = () => {
  //   return Object.values(filters).filter(value => value !== '').length;
  // };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requested By Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Requested By
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Enter username..."
              value={filters.requestedBy}
              onChange={(e) =>
                handleFilterChange("requestedBy", e.target.value)
              }
              className="h-11 pl-10 pr-4 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Requested To Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Requested To
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Enter username..."
              value={filters.requestedTo}
              onChange={(e) =>
                handleFilterChange("requestedTo", e.target.value)
              }
              className="h-11 pl-10 pr-4 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {totalCount > 0 && (
            <span className="font-medium">
              {filteredCount > 0
                ? `${filteredCount} of ${totalCount}`
                : totalCount}{" "}
              documents
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Filters</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
