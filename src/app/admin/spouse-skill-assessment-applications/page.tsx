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
import {
  useSpouseApplications,
  useSearchSpouseApplications,
} from "@/hooks/useSpouseApplications";
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
import { CalendarClock, X, Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Lazy load heavy components for better performance
const LazyApplicationsTable = lazy(() =>
  import("@/components/applications/ApplicationsTable").then((module) => ({
    default: module.ApplicationsTable,
  })),
);

type Country = "Australia" | "Canada";

const COUNTRIES: Country[] = ["Australia", "Canada"];

const SpouseSkillAssessmentApplications = memo(
  function SpouseSkillAssessmentApplications() {
    const { queryParams, updateQuery } = useQueryString();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const canView =
      user?.role === "master_admin" || user?.role === "team_leader";

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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deadlineCategory, setDeadlineCategory] = useState<
      "approaching" | "overdue" | "noDeadline" | "future" | null
    >(null);

    // Initialize recentActivity from URL params, default to false
    const [recentActivity, setRecentActivity] = useState(() => {
      return (
        queryParams.recentActivity === "true" ||
        queryParams.recentActivity === true
      );
    });

    // Separate state for the actual search query that triggers API calls
    const [searchQuery, setSearchQuery] = useState("");

    // Debounce search input for better performance
    const debouncedSearch = useDebounce(search, 300);

    // Performance monitoring
    const { measureAsync } = usePerformanceMonitor(
      "SpouseSkillAssessmentApplications",
    );

    // Check if we're in search mode
    const isSearchMode = searchQuery.trim() !== "";

    // Lightweight queries to get total counts per country for tab badges
    const { data: australiaCountData } = useSpouseApplications({
      page: 1,
      limit: 1,
      country: "Australia",
    });
    const { data: canadaCountData } = useSpouseApplications({
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
        country: selectedCountry,
      };

      return filterParams;
    }, [page, limit, dateRange, recentActivity, selectedCountry]);

    // Fetch regular spouse applications
    const {
      data: regularData,
      isLoading,
      error,
    } = useSpouseApplications(filters);

    // Fetch deadline-filtered data when deadline category is active
    const { data: deadlineData, isLoading: isDeadlineLoading } =
      useDeadlineStats(
        "spouse",
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

    // Create search params based on search type and value
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
    } = useSearchSpouseApplications(searchParamsForAPI);

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
        }, "searchSpouseApplications");
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

    // Auto-search when debounced search changes
    useEffect(() => {
      if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
        setSearchQuery(debouncedSearch.trim());
        setPage(1);
      } else if (debouncedSearch.trim() === "") {
        setSearchQuery("");
      }
    }, [debouncedSearch]);

    // Sync recentActivity state with URL params
    useEffect(() => {
      const urlRecentActivity =
        queryParams.recentActivity === "true" ||
        queryParams.recentActivity === true;
      if (urlRecentActivity !== recentActivity) {
        setRecentActivity(urlRecentActivity);
      }
    }, [queryParams.recentActivity, recentActivity]);

    // Sync deadlineCategory state with URL params
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

    // Sync country from URL params
    useEffect(() => {
      const urlCountry = queryParams.country as string | undefined;
      const resolved: Country = urlCountry === "Canada" ? "Canada" : "Australia";
      if (resolved !== selectedCountry) {
        setSelectedCountry(resolved);
      }
    }, [queryParams.country, selectedCountry]);

    const handleDateRangeChange = useCallback(
      (range: DateRange | undefined) => {
        setDateRange(range);
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

      // Update URL params to persist the state
      updateQuery({ recentActivity: newRecentActivity ? "true" : undefined });
    }, [recentActivity, updateQuery]);

    // Add keyboard shortcut for search (Enter key)
    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && search.trim()) {
          handleSearchClick();
        }
      },
      [search, handleSearchClick],
    );

    // Handle refresh functionality
    const handleRefresh = useCallback(async () => {
      setIsRefreshing(true);

      try {
        // Clear all spouse application-related cache
        await queryClient.invalidateQueries({
          queryKey: ["spouse-applications"],
        });

        // Clear search spouse applications cache
        await queryClient.invalidateQueries({
          queryKey: ["search-spouse-applications"],
        });

        // Clear deadline-stats cache
        await queryClient.invalidateQueries({
          queryKey: ["deadline-stats"],
        });

        // Force refetch current queries
        await Promise.all(
          [
            queryClient.refetchQueries({
              queryKey: ["spouse-applications", filters],
            }),
            searchQuery.trim() &&
              queryClient.refetchQueries({
                queryKey: ["spouse-applications-search", searchParamsForAPI],
              }),
            deadlineCategory &&
              queryClient.refetchQueries({
                queryKey: [
                  "deadline-stats",
                  "spouse",
                  deadlineCategory,
                  page,
                  limit,
                  selectedCountry,
                ],
              }),
          ].filter(Boolean),
        );
      } catch (error) {
        console.error("Error refreshing spouse applications:", error);
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

    const totalApplications = displayData?.pagination.totalRecords || 0;

    const displayError = isSearchMode ? searchQueryError : error;
    const displayLoading = isSearchMode
      ? isSearchQueryLoading
      : deadlineCategory
        ? isDeadlineLoading
        : isLoading;

    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCountry} spouse skill assessment applications
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
          type="spouse"
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
              onDateRangeChange={handleDateRangeChange}
              onLimitChange={handleLimitChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        {/* Active filter chips */}
        {dateRange?.from && (
          <div className="mb-4 flex flex-wrap gap-1.5">
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
                    ? "Error searching spouse applications"
                    : "Error loading spouse applications"}
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
                  No spouse applications found matching your search criteria.
                  Try adjusting your search term or search type.
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
              isSpouseApplication={true}
            />
          </Suspense>
        </div>

        {/* Pagination (only show when not in search mode) */}
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
      </main>
    );
  },
);

export default SpouseSkillAssessmentApplications;
