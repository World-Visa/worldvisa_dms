"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  Suspense,
  lazy,
  memo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApplications } from "@/hooks/useApplications";
import { useSearchApplications } from "@/hooks/useSearchApplications";
import { useDeadlineStats } from "@/hooks/useDeadlineStats";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useQueryString } from "@/hooks/useQueryString";
import { ApplicationsFilters } from "@/components/applications/ApplicationsFilters";
import { LodgementDeadlineStatsCard } from "@/components/applications/LodgementDeadlineStatsCard";
import { ApplicationsPagination } from "@/components/applications/ApplicationsPagination";
import {
  ApplicationsTableSkeleton,
  SearchResultsSkeleton,
} from "@/components/applications/ApplicationsTableSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, CalendarClock } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const LazyApplicationsTable = lazy(() =>
  import("@/components/applications/ApplicationsTable").then((module) => ({
    default: module.ApplicationsTable,
  })),
);

interface ApplicationsClientProps {
  initialRecentActivity?: boolean;
}

export const ApplicationsClient = memo(function ApplicationsClient({
  initialRecentActivity = false,
}: ApplicationsClientProps) {
  const { queryParams, updateQuery } = useQueryString();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canView = user?.role === "master_admin" || user?.role === "team_leader";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"name" | "phone" | "email">(
    "name",
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [handledBy, setHandledBy] = useState<string[]>([]);
  const [applicationStage, setApplicationStage] = useState<string[]>([]);
  const [applicationState, setApplicationState] = useState<
    "Active" | "In-Active" | undefined
  >(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deadlineCategory, setDeadlineCategory] = useState<
    "approaching" | "overdue" | "noDeadline" | null
  >(null);

  const [recentActivity, setRecentActivity] = useState(() => {
    return (
      queryParams.recentActivity === "true" ||
      queryParams.recentActivity === true ||
      initialRecentActivity
    );
  });

  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const { measureAsync } = usePerformanceMonitor("ApplicationsClient");

  const isSearchMode = searchQuery.trim() !== "";

  const filters = useMemo(() => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (dateRange?.from && dateRange?.to) {
      if (dateRange.from <= dateRange.to) {
        startDate = formatLocalDate(dateRange.from);
        endDate = formatLocalDate(dateRange.to);
      } else {
        startDate = formatLocalDate(dateRange.to);
        endDate = formatLocalDate(dateRange.from);
      }
    } else if (dateRange?.from) {
      startDate = formatLocalDate(dateRange.from);
    } else if (dateRange?.to) {
      endDate = formatLocalDate(dateRange.to);
    }

    const filterParams = {
      page,
      limit,
      startDate,
      endDate,
      recentActivity: recentActivity || undefined,
      handledBy: handledBy.length > 0 ? handledBy : undefined,
      applicationStage:
        applicationStage.length > 0 ? applicationStage : undefined,
      applicationState: applicationState ?? undefined,
    };

    return filterParams;
  }, [
    page,
    limit,
    dateRange,
    recentActivity,
    handledBy,
    applicationStage,
    applicationState,
  ]);

  // Fetch regular applications
  const { data: regularData, isFetching, error } = useApplications(filters);

  // Fetch deadline-filtered data when deadline category is active
  const { data: deadlineData, isLoading: isDeadlineLoading } = useDeadlineStats(
    "visa",
    canView && !!deadlineCategory,
    deadlineCategory,
    page,
    limit,
  );

  // Determine which data to display
  const displayData = useMemo(() => {
    if (deadlineCategory && deadlineData?.details) {
      // Use deadline-filtered data
      const categoryData = deadlineData.details[deadlineCategory];
      return {
        data: categoryData?.data || [],
        pagination: categoryData?.pagination || {
          currentPage: page,
          totalPages: 0,
          totalRecords: 0,
          limit: limit,
        },
      };
    }
    // Use regular applications data
    return regularData;
  }, [deadlineCategory, deadlineData, regularData, page, limit]);

  const searchParamsForAPI = useMemo(() => {
    if (!searchQuery.trim()) return {};

    const params: Record<string, string> = {};
    params[searchType] = searchQuery.trim();
    return params;
  }, [searchQuery, searchType]);

  const {
    data: searchData,
    isLoading: isSearchQueryLoading,
    error: searchQueryError,
  } = useSearchApplications(searchParamsForAPI);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSearchTypeChange = useCallback(
    (type: "name" | "phone" | "email") => {
      setSearchType(type);
    },
    [],
  );

  const handleSearchClick = useCallback(async () => {
    if (search.trim()) {
      await measureAsync(async () => {
        setSearchQuery(search.trim());
        setPage(1);
      }, "searchApplications");
    }
  }, [search, measureAsync]);

  useEffect(() => {
    if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
      setSearchQuery(debouncedSearch.trim());
      setPage(1);
    } else if (debouncedSearch.trim() === "") {
      setSearchQuery("");
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const urlRecentActivity =
      queryParams.recentActivity === "true" ||
      queryParams.recentActivity === true;
    if (urlRecentActivity !== recentActivity) {
      setRecentActivity(urlRecentActivity);
    }
  }, [queryParams.recentActivity, recentActivity]);

  useEffect(() => {
    const urlDeadlineCategory = queryParams.deadlineCategory;
    if (
      urlDeadlineCategory &&
      ["approaching", "overdue", "noDeadline"].includes(
        urlDeadlineCategory as string,
      )
    ) {
      setDeadlineCategory(
        urlDeadlineCategory as "approaching" | "overdue" | "noDeadline",
      );
    } else if (!urlDeadlineCategory && deadlineCategory) {
      setDeadlineCategory(null);
    }
  }, [queryParams.deadlineCategory, deadlineCategory]);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  }, []);

  const handleHandledByChange = useCallback((value: string[]) => {
    setHandledBy(value);
    setPage(1);
  }, []);

  const handleApplicationStageChange = useCallback((value: string[]) => {
    setApplicationStage(value);
    setPage(1);
  }, []);

  const handleApplicationStateChange = useCallback(
    (value: "Active" | "In-Active" | undefined) => {
      setApplicationState(value);
      setPage(1);
    },
    [],
  );

  const handleDeadlineCategoryClick = useCallback(
    (category: "approaching" | "overdue" | "noDeadline" | null) => {
      setDeadlineCategory(category);
      setPage(1);
      updateQuery({ deadlineCategory: category || undefined });
    },
    [updateQuery],
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSearchQuery("");
    setSearchType("name");
    setDateRange(undefined);
    setHandledBy([]);
    setApplicationStage([]);
    setApplicationState(undefined);
    setRecentActivity(false);
    setDeadlineCategory(null);
    setPage(1);

    updateQuery({ recentActivity: undefined, deadlineCategory: undefined });
  }, [updateQuery]);

  const handleRecentActivityToggle = useCallback(() => {
    const newRecentActivity = !recentActivity;
    setRecentActivity(newRecentActivity);
    setPage(1);

    updateQuery({ recentActivity: newRecentActivity ? "true" : undefined });
  }, [recentActivity, updateQuery]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && search.trim()) {
        handleSearchClick();
      }
    },
    [search, handleSearchClick],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: ["applications"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["search-applications"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["deadline-stats"],
      });

      await Promise.all(
        [
          queryClient.refetchQueries({
            queryKey: ["applications", filters],
          }),
          searchQuery.trim() &&
            queryClient.refetchQueries({
              queryKey: ["search-applications", searchParamsForAPI],
            }),
          deadlineCategory &&
            queryClient.refetchQueries({
              queryKey: [
                "deadline-stats",
                "visa",
                deadlineCategory,
                page,
                limit,
              ],
            }),
        ].filter(Boolean),
      );
    } catch (error) {
      console.error("Error refreshing applications:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    queryClient,
    filters,
    searchQuery,
    searchParamsForAPI,
    deadlineCategory,
    page,
    limit,
  ]);

  const totalApplications = displayData?.pagination.totalRecords || 0;

  const displayError = isSearchMode ? searchQueryError : error;
  const displayLoading = isSearchMode
    ? isSearchQueryLoading
    : deadlineCategory
      ? isDeadlineLoading
      : isFetching;

  return (
    <>
      {/* Filters Section */}
      <div className="flex flex-col w-full sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900  mb-2 flex items-center gap-2">
            Visa Applications
          </h2>
          <p className="text-muted-foreground">
            Manage and review all visa applications assigned to you.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <LodgementDeadlineStatsCard
        type="visa"
        selectedCategory={deadlineCategory}
        onCategoryClick={handleDeadlineCategoryClick}
      />

      {/* Filters Toggle Section */}
      <div className="mb-6 w-full flex justify-between gap-4 items-start">
        <div className="flex gap-2 shrink-0">
          <Button
            variant={!recentActivity ? "default" : "outline"}
            className="rounded-full py-3 px-6 cursor-pointer"
            onClick={handleRecentActivityToggle}
          >
            All applications
          </Button>
          <Button
            variant={recentActivity ? "default" : "outline"}
            className="rounded-full py-3 px-6 cursor-pointer"
            onClick={handleRecentActivityToggle}
          >
            Recent activities
          </Button>
        </div>

        <div className="flex-1 min-w-0 flex justify-end">
          <ApplicationsFilters
            search={search}
            searchType={searchType}
            dateRange={dateRange}
            limit={limit}
            handledBy={handledBy}
            applicationStage={applicationStage}
            applicationState={applicationState}
            isSearchMode={isSearchMode}
            onSearchChange={handleSearchChange}
            onSearchTypeChange={handleSearchTypeChange}
            onSearchClick={handleSearchClick}
            onDateRangeChange={handleDateRangeChange}
            onLimitChange={handleLimitChange}
            onHandledByChange={handleHandledByChange}
            onApplicationStageChange={handleApplicationStageChange}
            onApplicationStateChange={handleApplicationStateChange}
            onClearFilters={handleClearFilters}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Badge variant="secondary">
          Total applications:&nbsp;
          {displayLoading ? "..." : totalApplications.toLocaleString()}
        </Badge>
      </div>

      {/* Deadline Filter Indicator */}
      {deadlineCategory && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <CalendarClock className="h-3 w-3" />
            Deadline:{" "}
            {deadlineCategory === "approaching"
              ? "Approaching"
              : deadlineCategory === "overdue"
                ? "Overdue"
                : "No Deadline"}
            <button
              onClick={() => handleDeadlineCategoryClick(null)}
              className="ml-1 hover:text-destructive transition-colors"
              aria-label="Clear deadline filter"
            >
              ×
            </button>
          </Badge>
        </div>
      )}

      {/* Error State */}
      {displayError && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">
                {isSearchMode
                  ? "Error searching applications"
                  : "Error loading applications"}
              </p>
              <p className="text-sm mt-1">
                {displayError instanceof Error
                  ? displayError.message
                  : displayError}
              </p>
              {isSearchMode && (
                <p className="text-xs mt-2 text-gray-500">
                  Please check your search term and try again. Make sure you
                  have at least 2 characters.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results Header */}
      {isSearchMode && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Search Results ({searchData?.data?.length || 0} results)
          </h3>
          <p className="text-sm text-gray-600">
            Searching for &quot;{searchQuery}&quot; in {searchType}
          </p>
          {!isSearchQueryLoading && searchData?.data?.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                No applications found matching your search criteria. Try
                adjusting your search term or search type.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Applications Table */}
      <div className="mb-6">
        <Suspense
          fallback={
            isSearchMode ? (
              <SearchResultsSkeleton />
            ) : (
              <ApplicationsTableSkeleton />
            )
          }
        >
          <LazyApplicationsTable
            applications={displayData?.data || []}
            currentPage={page}
            limit={limit}
            isLoading={displayLoading}
            isSearchMode={isSearchMode}
            searchResults={searchData?.data || []}
            isSearchLoading={isSearchQueryLoading}
          />
        </Suspense>
      </div>

      {/* Pagination */}
      {!isSearchMode &&
        displayData &&
        displayData.pagination.totalPages > 1 && (
          <ApplicationsPagination
            currentPage={page}
            totalRecords={displayData.pagination.totalRecords}
            limit={limit}
            onPageChange={handlePageChange}
          />
        )}
    </>
  );
});
