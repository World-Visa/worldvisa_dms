"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Search, User, Phone, Mail, Filter, X, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ApplicationsFiltersProps {
  search: string;
  searchType: "name" | "phone" | "email";
  dateRange: DateRange | undefined;
  limit: number;
  isSearchMode?: boolean;
  onSearchChange: (value: string) => void;
  onSearchTypeChange: (type: "name" | "phone" | "email") => void;
  onSearchClick: () => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onLimitChange: (value: number) => void;
  onClearFilters: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

export function ApplicationsFilters({
  search,
  searchType,
  dateRange,
  limit,
  isSearchMode = false,
  onSearchChange,
  onSearchTypeChange,
  onSearchClick,
  onDateRangeChange,
  onLimitChange,
  onClearFilters,
  onKeyPress,
}: ApplicationsFiltersProps) {
  const hasActiveFilters = search.trim() || dateRange?.from || dateRange?.to;

  const getSearchIcon = () => {
    switch (searchType) {
      case "name":
        return <User className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full flex gap-4">
      {/* Main Search Bar - Airbnb Style */}
      <div className="relative w-full bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all duration-200 mb-6">
        <div className="flex items-center divide-x divide-gray-300">
          {/* Search Type */}
          <div className="relative flex-shrink-0">
            <Select value={searchType} onValueChange={onSearchTypeChange}>
              <SelectTrigger className="border-0 bg-transparent h-14 px-6 rounded-l-full focus:ring-0 focus:ring-offset-0 hover:bg-gray-50 transition-colors min-w-[140px] ">
                <div className="flex items-center gap-2 text-gray-700">
                  {getSearchIcon()}
                  <span className="font-medium capitalize">{searchType}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-200 shadow-xl mt-2">
                <SelectGroup>
                  <SelectItem value="name" className="rounded-lg py-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-600" />
                      <span>Search by name</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="phone" className="rounded-lg py-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span>Search by phone</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="email" className="rounded-lg py-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span>Search by email</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              placeholder={`Enter ${searchType}...`}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={onKeyPress}
              className="border-0 bg-transparent h-14 px-6 focus:ring-0 focus:ring-offset-0 text-gray-900 placeholder:text-gray-500 font-medium"
            />
          </div>

          {/* Search Button */}
          <div className="flex-shrink-0 p-2">
            <Button
              onClick={onSearchClick}
              disabled={!search.trim()}
              className={`h-10 w-10 rounded-full p-0 transition-all duration-200 ${
                search.trim()
                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Single Line with All Filters */}
      <div className="flex items-center gap-4 mb-6">
        {/* Date Range */}
        <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-full hover:border-gray-400 transition-colors cursor-pointer bg-white">
          <span className="text-sm font-medium text-gray-700">Dates</span>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder="Any dates"
          />
        </div>

        {/* Results per page */}
        <Select
          value={limit.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="border border-gray-300 rounded-full px-4 py-3 h-auto hover:border-gray-400 transition-colors bg-white min-w-[120px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Show {limit}</span>
            </div>
            <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-200 shadow-xl">
            <SelectGroup>
              <SelectItem value="10" className="rounded-lg py-2">10 results</SelectItem>
              <SelectItem value="20" className="rounded-lg py-2">20 results</SelectItem>
              <SelectItem value="50" className="rounded-lg py-2">50 results</SelectItem>
              <SelectItem value="100" className="rounded-lg py-2">100 results</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="ghost"
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full font-medium text-sm underline"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pb-6 border-b border-gray-200">
          {search.trim() && (
            <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
              <span>{searchType}: &quot;{search}&quot;</span>
              <button
                onClick={() => onSearchChange("")}
                className="hover:bg-white rounded-full p-1 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {(dateRange?.from || dateRange?.to) && (
            <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
              <span>
                {dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString()}
              </span>
              <button
                onClick={() => onDateRangeChange(undefined)}
                className="hover:bg-white rounded-full p-1 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}