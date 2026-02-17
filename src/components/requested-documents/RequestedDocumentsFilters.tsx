"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsers } from "@/hooks/useAdminUsers";

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
  const { data: adminUsers = [], isLoading: isLoadingUsers } = useAdminUsers();
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
      <div className="flex justify-end">
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
          <Select
            value={filters.requestedBy || "all"}
            onValueChange={(v) =>
              handleFilterChange("requestedBy", v === "all" ? "" : v)
            }
            disabled={isLoadingUsers}
          >
            <SelectTrigger className="h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder={isLoadingUsers ? "Loading..." : "All users"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {adminUsers.map((u) => (
                <SelectItem key={u._id} value={u.username}>
                  {u.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Requested To Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Requested To
          </label>
          <Select
            value={filters.requestedTo || "all"}
            onValueChange={(v) =>
              handleFilterChange("requestedTo", v === "all" ? "" : v)
            }
            disabled={isLoadingUsers}
          >
            <SelectTrigger className="h-11 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder={isLoadingUsers ? "Loading..." : "All users"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {adminUsers.map((u) => (
                <SelectItem key={u._id} value={u.username}>
                  {u.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex justify-end items-center">
        {/* <div className="text-sm text-gray-600">
          {totalCount > 0 && (
            <span className="font-medium">
              {filteredCount > 0
                ? `${filteredCount} of ${totalCount}`
                : totalCount}{" "}
              documents
            </span>
          )}
        </div> */}

        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button
              variant="link"
              onClick={clearFilters}
              className="p-0"
            >
              <span className="hidden sm:inline text-gray-600 cursor-pointer hover:text-gray-800">Clear Filters</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
