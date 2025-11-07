"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Search, User, Phone, Mail, Filter, X, Calendar, Users } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

interface ApplicationsFiltersProps {
  search: string;
  searchType: "name" | "phone" | "email";
  dateRange: DateRange | undefined;
  limit: number;
  handledBy?: string[];
  isSearchMode?: boolean;
  onSearchChange: (value: string) => void;
  onSearchTypeChange: (type: "name" | "phone" | "email") => void;
  onSearchClick: () => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onLimitChange: (value: number) => void;
  onHandledByChange?: (value: string[]) => void;
  onClearFilters: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

export function ApplicationsFilters({
  search,
  searchType,
  dateRange,
  limit,
  handledBy = [],
  onSearchChange,
  onSearchTypeChange,
  onSearchClick,
  onDateRangeChange,
  onLimitChange,
  onHandledByChange,
  onClearFilters,
  onKeyPress,
}: ApplicationsFiltersProps) {
  const { user } = useAuth();
  const { data: adminUsers, isLoading: isLoadingAdmins } = useAdminUsers();

  const canViewHandledByFilter = useMemo(() => {
    if (!user?.role) return false;
    return ['master_admin', 'supervisor',].includes(user.role);
  }, [user?.role]);

  const adminOptions: MultiSelectOption[] = useMemo(() => {
    if (!adminUsers) return [];
    return adminUsers
      .filter((admin) => admin.role === "admin")
      .map((admin) => ({
        value: admin.username,
        label: admin.username,
        role: admin.role,
      }));
  }, [adminUsers]);

  const hasActiveFilters = dateRange?.from || dateRange?.to || (handledBy && handledBy.length > 0);
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateRange?.from || dateRange?.to) count++;
    if (handledBy && handledBy.length > 0) count++;
    return count;
  }, [dateRange, handledBy]);

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
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center divide-x divide-gray-300">
            <div className="relative flex-shrink-0">
              <Select value={searchType} onValueChange={onSearchTypeChange}>
                <SelectTrigger className="border-0 bg-transparent h-10 px-4 rounded-l-lg focus:ring-0 focus:ring-offset-0 hover:bg-gray-50 transition-colors min-w-[100px]">
                  <div className="flex items-center gap-2 text-gray-700">
                    {getSearchIcon()}
                    <span className="font-medium text-sm capitalize">{searchType}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                  <SelectGroup>
                    <SelectItem value="name" className="rounded-md py-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">Search by name</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="phone" className="rounded-md py-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">Search by phone</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="email" className="rounded-md py-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">Search by email</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 relative">
              <Input
                placeholder={`Search by ${searchType}...`}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={onKeyPress}
                className="border-0 bg-transparent h-10 px-4 focus:ring-0 focus:ring-offset-0 text-gray-900 placeholder:text-gray-500 text-sm"
              />
            </div>

            <div className="flex-shrink-0 p-1.5">
              <Button
                onClick={onSearchClick}
                disabled={!search.trim()}
                size="sm"
                className={`h-7 w-7 rounded-md p-0 transition-all ${
                  search.trim()
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`h-10 w-10 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors bg-white p-0 relative ${
                hasActiveFilters ? "border-gray-900 ring-1 ring-gray-900" : ""
              }`}
              aria-label="Open filters menu"
            >
              <Filter className="h-4 w-4 text-gray-700" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-gray-900 text-white text-[10px] font-medium rounded-full flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-4 rounded-lg shadow-lg">
            <DropdownMenuLabel className="text-base font-semibold mb-3">Filters</DropdownMenuLabel>
            
            <DropdownMenuSeparator className="mb-4" />
            
            <DropdownMenuGroup>
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  Date Range
                </label>
                <DateRangePicker
                  value={dateRange}
                  onChange={onDateRangeChange}
                  placeholder="Select date range"
                  className="w-full"
                />
              </div>

              {canViewHandledByFilter && onHandledByChange && (
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    Handled By
                  </label>
                  <MultiSelect
                    options={adminOptions}
                    value={handledBy}
                    onChange={onHandledByChange}
                    placeholder="Select admins..."
                    disabled={isLoadingAdmins}
                    loading={isLoadingAdmins}
                    className="w-full"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Results per page</label>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => onLimitChange(Number(value))}
                >
                  <SelectTrigger className="w-full border-gray-300 rounded-md h-9">
                    <SelectValue>{limit} results</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-gray-200 shadow-lg">
                    <SelectGroup>
                      <SelectItem value="10" className="rounded-md py-2 text-sm">10 results</SelectItem>
                      <SelectItem value="20" className="rounded-md py-2 text-sm">20 results</SelectItem>
                      <SelectItem value="50" className="rounded-md py-2 text-sm">50 results</SelectItem>
                      <SelectItem value="100" className="rounded-md py-2 text-sm">100 results</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuGroup>

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator className="my-4" />
                <Button
                  onClick={onClearFilters}
                  variant="ghost"
                  className="w-full text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  Clear all filters
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {dateRange?.from && dateRange?.to && (
            <div className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium">
              <span>
                {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
              </span>
              <button
                onClick={() => onDateRangeChange(undefined)}
                className="hover:bg-white rounded-full p-0.5 transition-colors ml-1"
                aria-label="Remove date filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {handledBy && handledBy.length > 0 && onHandledByChange && (
            <div className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium">
              <Users className="h-3 w-3" />
              <span>
                {handledBy.length === 1 
                  ? `Handled by: ${handledBy[0]}` 
                  : `Handled by: ${handledBy.length} admins`}
              </span>
              <button
                onClick={() => onHandledByChange([])}
                className="hover:bg-white rounded-full p-0.5 transition-colors ml-1"
                aria-label="Remove handled by filter"
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