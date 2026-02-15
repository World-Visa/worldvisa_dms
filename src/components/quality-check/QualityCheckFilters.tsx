"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Search, Filter, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export interface QualityCheckFilters {
  search: string;
  searchType: "name" | "email" | "phone";
  status: string;
  handledBy: string;
  qualityCheckFrom: string;
  dateRange: DateRange | undefined;
  limit: number;
}

interface QualityCheckFiltersProps {
  search: string;
  searchType: "name" | "email" | "phone";
  status: string;
  handledBy: string;
  qualityCheckFrom: string;
  dateRange: DateRange | undefined;
  limit: number;
  isSearchMode: boolean;
  onSearchChange: (value: string) => void;
  onSearchTypeChange: (type: "name" | "email" | "phone") => void;
  onSearchClick: () => void;
  onStatusChange: (status: string) => void;
  onHandledByChange: (handledBy: string) => void;
  onQualityCheckFromChange: (qualityCheckFrom: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onLimitChange: (limit: number) => void;
  onClearFilters: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export function QualityCheckFilters({
  search,
  searchType,
  status,
  handledBy,
  qualityCheckFrom,
  dateRange,
  limit,
  isSearchMode,
  onSearchChange,
  onSearchTypeChange,
  onSearchClick,
  onStatusChange,
  onHandledByChange,
  onQualityCheckFromChange,
  onDateRangeChange,
  onLimitChange,
  onClearFilters,
  onKeyPress,
}: QualityCheckFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    status !== "all" ||
    handledBy !== "" ||
    qualityCheckFrom !== "" ||
    dateRange?.from ||
    dateRange?.to;

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Search className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Search Applications
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search by ${searchType}...`}
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyPress={onKeyPress}
                  className="pl-10 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                />
              </div>
              <Select value={searchType} onValueChange={onSearchTypeChange}>
                <SelectTrigger className="w-[140px] h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={onSearchClick}
                disabled={!search.trim()}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm font-medium"
              >
                Search
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleFilterToggle}
              className={cn(
                "flex items-center gap-2 h-12 px-4 border-gray-200 rounded-xl shadow-sm",
                showFilters && "bg-blue-50 border-blue-300 text-blue-700",
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                  {
                    [
                      status !== "all",
                      handledBy !== "",
                      qualityCheckFrom !== "",
                      dateRange?.from,
                      dateRange?.to,
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="flex items-center gap-2 h-12 px-4 border-gray-200 rounded-xl shadow-sm"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Clear</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Filter className="h-4 w-4 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Advanced Filters
            </h3>
          </div>

          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Status
                </Label>
                <Select value={status} onValueChange={onStatusChange}>
                  <SelectTrigger className="h-11 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="lodged">Lodged</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Handled By Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Handled By
                </Label>
                <Input
                  placeholder="Enter name..."
                  value={handledBy}
                  onChange={(e) => onHandledByChange(e.target.value)}
                  className="h-11 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                />
              </div>

              {/* Quality Check From Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Quality Check From
                </Label>
                <Input
                  placeholder="Enter name..."
                  value={qualityCheckFrom}
                  onChange={(e) => onQualityCheckFromChange(e.target.value)}
                  className="h-11 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                />
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Date Range
                </Label>
                <DateRangePicker
                  value={dateRange}
                  onChange={onDateRangeChange}
                  className="h-11"
                />
              </div>
            </div>

            {/* Results Per Page */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Results per page:
                </Label>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => onLimitChange(Number(value))}
                >
                  <SelectTrigger className="w-24 h-9 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="flex items-center gap-2 h-9 px-4 border-gray-200 rounded-lg shadow-sm text-gray-600 hover:text-gray-800"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Mode Indicator */}
      {isSearchMode && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Search Active
                </p>
                <p className="text-xs text-blue-700">
                  Showing results for &quot;{search}&quot; in {searchType}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg"
            >
              Clear Search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
