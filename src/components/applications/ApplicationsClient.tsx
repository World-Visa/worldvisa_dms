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
import { ApplicationsSearch, ApplicationsFilters } from "@/components/applications/ApplicationsFilters";
import { LodgementDeadlineStatsCard } from "@/components/applications/LodgementDeadlineStatsCard";
import { ApplicationsPagination } from "@/components/applications/ApplicationsPagination";
import {
  ApplicationsTableSkeleton,
  SearchResultsSkeleton,
} from "@/components/applications/ApplicationsTableSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, CalendarClock, X, Calendar, Users, Layers, CircleDot } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LazyApplicationsTable = lazy(() =>
  import("@/components/applications/ApplicationsTable").then((module) => ({
    default: module.ApplicationsTable,
  })),
);

type Country = "Australia" | "Canada";

const COUNTRIES: Country[] = ["Australia", "Canada"];

const COUNTRY_IMAGE_URLS: Record<Country, string> = {
  Australia:
    "https://images.pexels.com/photos/1766215/pexels-photo-1766215.jpeg",
  Canada:
    "https://images.pexels.com/photos/2448946/pexels-photo-2448946.jpeg",
};

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

  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    const urlCountry = queryParams.country as string | undefined;
    return urlCountry === "Canada" ? "Canada" : "Australia";
  });

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
    "approaching" | "overdue" | "noDeadline" | "future" | null
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

  // Lightweight queries to get total counts per country for tab badges
  const { data: australiaCountData } = useApplications({
    page: 1,
    limit: 1,
    country: "Australia",
  });
  const { data: canadaCountData } = useApplications({
    page: 1,
    limit: 1,
    country: "Canada",
  });

  const countryTotals: Record<Country, number | undefined> = {
    Australia: australiaCountData?.pagination.totalRecords,
    Canada: canadaCountData?.pagination.totalRecords,
  };

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
      country: selectedCountry,
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
    selectedCountry,
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
    selectedCountry,
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
    params.country = selectedCountry;
    return params;
  }, [searchQuery, searchType, selectedCountry]);

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

  const handleCountryChange = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      setPage(1);
      setDeadlineCategory(null);
      setSearch("");
      setSearchQuery("");
      updateQuery({
        country: country === "Australia" ? undefined : country,
        deadlineCategory: undefined,
      });
    },
    [updateQuery],
  );

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
      ["approaching", "overdue", "noDeadline", "future"].includes(
        urlDeadlineCategory as string,
      )
    ) {
      setDeadlineCategory(
        urlDeadlineCategory as
        | "approaching"
        | "overdue"
        | "noDeadline"
        | "future",
      );
    } else if (!urlDeadlineCategory && deadlineCategory) {
      setDeadlineCategory(null);
    }
  }, [queryParams.deadlineCategory, deadlineCategory]);

  useEffect(() => {
    const urlCountry = queryParams.country as string | undefined;
    const resolved: Country = urlCountry === "Canada" ? "Canada" : "Australia";
    if (resolved !== selectedCountry) {
      setSelectedCountry(resolved);
    }
  }, [queryParams.country, selectedCountry]);

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
    (
      category:
        | "approaching"
        | "overdue"
        | "noDeadline"
        | "future"
        | null,
    ) => {
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
    setSelectedCountry("Australia");
    setPage(1);

    updateQuery({
      recentActivity: undefined,
      deadlineCategory: undefined,
      country: undefined,
    });
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
              selectedCountry,
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
    selectedCountry,
  ]);


  const displayError = isSearchMode ? searchQueryError : error;
  const displayLoading = isSearchMode
    ? isSearchQueryLoading
    : deadlineCategory
      ? isDeadlineLoading
      : isFetching;

  return (
    <>
      {/* Country Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          {COUNTRIES.map((country) => {
            const isActive = selectedCountry === country;
            const count = countryTotals[country];
            return (
              <button
                key={country}
                type="button"
                onClick={() => handleCountryChange(country)}
                className={cn(
                  "relative flex items-center gap-2.5 px-5 pb-3 pt-2 text-sm font-medium tracking-wide",
                  "focus:outline-none transition-colors duration-150",
                  "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full",
                  "after:transition-all after:duration-200",
                  isActive
                    ? "text-gray-900 after:bg-gray-900"
                    : "text-gray-400 hover:text-gray-600 after:bg-transparent hover:after:bg-gray-200",
                )}
              >
                <Avatar className="size-8 shrink-0" >
                  <AvatarImage
                    src={COUNTRY_IMAGE_URLS[country]}
                    alt={country}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs">
                    {country.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                {country}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-all duration-150",
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {count !== undefined ? count.toLocaleString() : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title + Search row */}
      <div className="mb-6 flex w-full items-center justify-between gap-4">
        <h2 className="text-2xl font-medium text-foreground">
          {selectedCountry} visa applications
        </h2>
        <ApplicationsSearch
          search={search}
          searchType={searchType}
          onSearchChange={handleSearchChange}
          onSearchTypeChange={handleSearchTypeChange}
          onSearchClick={handleSearchClick}
          onKeyDown={handleKeyPress}
        />
      </div>

      <LodgementDeadlineStatsCard
        type="visa"
        selectedCategory={deadlineCategory}
        onCategoryClick={handleDeadlineCategoryClick}
        country={selectedCountry}
      />

      {/* Tabs + Filters row */}
      <div className="mb-4 flex items-end justify-between border-b border-gray-200">
        <div className="flex gap-6 text-base font-medium">
          {["All applications", "Recent activities"].map((label, idx) => {
            const isActive = idx === 0 ? !recentActivity : recentActivity;
            return (
              <button
                key={label}
                type="button"
                className={cn(
                  "px-4 py-2 focus:outline-none transition-colors",
                  isActive
                    ? "-mb-px border-b-2 border-gray-900 font-semibold text-gray-900"
                    : "cursor-pointer rounded-md text-gray-500 hover:bg-gray-100",
                )}
                onClick={handleRecentActivityToggle}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="pb-2">
          <ApplicationsFilters
            dateRange={dateRange}
            limit={limit}
            handledBy={handledBy}
            applicationStage={applicationStage}
            applicationState={applicationState}
            onDateRangeChange={handleDateRangeChange}
            onLimitChange={handleLimitChange}
            onHandledByChange={handleHandledByChange}
            onApplicationStageChange={handleApplicationStageChange}
            onApplicationStateChange={handleApplicationStateChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      {/* Active filter chips */}
      {(dateRange?.from || handledBy.length > 0 || applicationStage.length > 0 || applicationState) && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {dateRange?.from && (
            <Badge variant="secondary" className="gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium">
              <Calendar className="h-3 w-3" />
              <span>
                {dateRange.from.toLocaleDateString()}
                {dateRange.to ? ` – ${dateRange.to.toLocaleDateString()}` : ""}
              </span>
              <button
                type="button"
                onClick={() => handleDateRangeChange(undefined)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Remove date filter"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {handledBy.length > 0 && (
            <Badge variant="secondary" className="gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium">
              <Users className="h-3 w-3" />
              <span>
                {handledBy.length === 1
                  ? `Handled by: ${handledBy[0]}`
                  : `Handled by: ${handledBy.length} admins`}
              </span>
              <button
                type="button"
                onClick={() => handleHandledByChange([])}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Remove handled by filter"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {applicationStage.length > 0 && (
            <Badge variant="secondary" className="gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium">
              <Layers className="h-3 w-3" />
              <span>
                {applicationStage.length === 1
                  ? applicationStage[0]
                  : `${applicationStage.length} stages`}
              </span>
              <button
                type="button"
                onClick={() => handleApplicationStageChange([])}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Remove stage filter"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {applicationState && (
            <Badge variant="secondary" className="gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium">
              <CircleDot className="h-3 w-3" />
              <span>State: {applicationState}</span>
              <button
                type="button"
                onClick={() => handleApplicationStateChange(undefined)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Remove state filter"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
        </div>
      )}

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
                : deadlineCategory === "future"
                  ? "Future"
                  : "No Deadline"}
            <button
              onClick={() => handleDeadlineCategoryClick(null)}
              className="ml-1 hover:text-destructive transition-colors"
              aria-label="Clear deadline filter"
            >
              <X className="h-3 w-3 text-gray-500 hover:text-destructive" />
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
          <h3 className="text-lg font-medium text-foreground">
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
