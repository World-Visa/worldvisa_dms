"use client";

import { memo, Suspense, lazy } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDeadlineStats } from "@/hooks/useDeadlineStats";
import { useApplicationsListState } from "@/hooks/useApplicationsListState";
import {
  ApplicationsSearch,
  ApplicationsFilters,
} from "@/components/applications/ApplicationsFilters";
import { LodgementDeadlineStatsCard } from "@/components/applications/LodgementDeadlineStatsCard";
import { ApplicationsPagination } from "@/components/applications/ApplicationsPagination";
import {
  ApplicationsTableSkeleton,
  SearchResultsSkeleton,
} from "@/components/applications/ApplicationsTableSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, X, Calendar, Users, Layers, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRIES, COUNTRY_IMAGE_URLS } from "@/lib/applications/utils";
import type {
  Country,
  DeadlineCategory,
  ApplicationsFilters as ApplicationsFiltersType,
  ApplicationsResponse,
  SearchParams,
  EnabledFilters,
  VisaApplication,
} from "@/types/applications";

/** Minimal shape required from any search hook — only `.data` is consumed. */
interface SearchableResponse {
  data: VisaApplication[];
}

const LazyApplicationsTable = lazy(() =>
  import("@/components/applications/ApplicationsTable").then((module) => ({
    default: module.ApplicationsTable,
  })),
);

// ─── CountryTabNav (internal) ────────────────────────────────────────────────

interface CountryTabNavProps {
  selectedCountry: Country;
  countryTotals: Record<Country, number | undefined>;
  onCountryChange: (country: Country) => void;
}

function CountryTabNav({
  selectedCountry,
  countryTotals,
  onCountryChange,
}: CountryTabNavProps) {
  return (
    <div className="mb-6">
      <div className="flex border-b border-gray-200">
        {COUNTRIES.map((country) => {
          const isActive = selectedCountry === country;
          const count = countryTotals[country];
          return (
            <button
              key={country}
              type="button"
              onClick={() => onCountryChange(country)}
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
              <Avatar className="size-8 shrink-0">
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
  );
}

// ─── ApplicationsListPage ────────────────────────────────────────────────────

interface ApplicationsListPageProps {
  useApplicationsHook: (
    filters: ApplicationsFiltersType,
  ) => UseQueryResult<ApplicationsResponse>;
  useSearchHook: (
    params: SearchParams,
  ) => UseQueryResult<SearchableResponse>;
  type: "visa" | "spouse";
  getTitle: (country: Country) => string;
  enabledFilters: EnabledFilters;
  isSpouseApplication?: boolean;
  initialRecentActivity?: boolean;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export const ApplicationsListPage = memo(function ApplicationsListPage({
  useApplicationsHook,
  useSearchHook,
  type,
  getTitle,
  enabledFilters,
  isSpouseApplication = false,
  initialRecentActivity = false,
  onRefresh: _onRefresh,
  isRefreshing: _isRefreshing,
}: ApplicationsListPageProps) {
  const { user } = useAuth();
  const canView =
    user?.role === "master_admin" || user?.role === "team_leader";

  const state = useApplicationsListState({
    initialRecentActivity,
    componentName: type === "visa" ? "ApplicationsClient" : "SpouseSkillAssessmentApplications",
  });

  const {
    selectedCountry,
    page,
    limit,
    search,
    searchType,
    searchQuery,
    dateRange,
    handledBy,
    applicationStage,
    applicationState,
    deadlineCategory,
    recentActivity,
    isSearchMode,
    filters,
    searchParamsForAPI,
    handleCountryChange,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSearchTypeChange,
    handleSearchClick,
    handleKeyPress,
    handleDateRangeChange,
    handleHandledByChange,
    handleApplicationStageChange,
    handleApplicationStateChange,
    handleDeadlineCategoryClick,
    handleClearFilters,
    handleRecentActivityToggle,
  } = state;

  // ── Country count queries (lightweight badge totals) ──────────────────────
  const { data: australiaCountData } = useApplicationsHook({
    page: 1,
    limit: 1,
    country: "Australia",
  });
  const { data: canadaCountData } = useApplicationsHook({
    page: 1,
    limit: 1,
    country: "Canada",
  });

  const countryTotals: Record<Country, number | undefined> = {
    Australia: australiaCountData?.pagination.totalRecords,
    Canada: canadaCountData?.pagination.totalRecords,
  };

  // ── Main data query ───────────────────────────────────────────────────────
  const { data: regularData, isFetching, error } = useApplicationsHook(filters);

  // ── Deadline-filtered data ────────────────────────────────────────────────
  const { data: deadlineData, isLoading: isDeadlineLoading } = useDeadlineStats(
    type,
    canView && !!deadlineCategory,
    deadlineCategory,
    page,
    limit,
    selectedCountry,
  );

  // ── Search query ──────────────────────────────────────────────────────────
  const {
    data: searchData,
    isLoading: isSearchQueryLoading,
    error: searchQueryError,
  } = useSearchHook(searchParamsForAPI);

  // ── Determine display data ────────────────────────────────────────────────
  const displayData = (() => {
    if (deadlineCategory && deadlineData?.details) {
      const categoryData = deadlineData.details[deadlineCategory];
      return {
        data: categoryData?.data ?? [],
        pagination: categoryData?.pagination ?? {
          currentPage: page,
          totalPages: 0,
          totalRecords: 0,
          limit,
        },
      };
    }
    return regularData;
  })();

  const displayError = isSearchMode ? searchQueryError : error;
  const displayLoading = isSearchMode
    ? isSearchQueryLoading
    : deadlineCategory
      ? isDeadlineLoading
      : isFetching;

  // ── Deadline label helper ─────────────────────────────────────────────────
  const deadlineCategoryLabel: Record<DeadlineCategory, string> = {
    approaching: "Approaching",
    overdue: "Overdue",
    future: "Future",
    noDeadline: "No Deadline",
  };

  return (
    <>
      <CountryTabNav
        selectedCountry={selectedCountry}
        countryTotals={countryTotals}
        onCountryChange={handleCountryChange}
      />

      {/* Title + Search */}
      <div className="mb-6 flex w-full items-center justify-between gap-4">
        <h2 className="text-2xl font-medium text-foreground">
          {getTitle(selectedCountry)}
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
        type={type}
        selectedCategory={deadlineCategory}
        onCategoryClick={handleDeadlineCategoryClick}
        country={selectedCountry}
      />

      {/* Tabs + Filters */}
      <div className="mb-4 flex items-end justify-between border-b border-gray-200">
        <div className="flex gap-6 text-base font-medium">
          {(["All applications", "Recent activities"] as const).map(
            (label, idx) => {
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
            },
          )}
        </div>
        <div className="pb-2">
          <ApplicationsFilters
            dateRange={dateRange}
            limit={limit}
            handledBy={enabledFilters.handledBy ? handledBy : undefined}
            applicationStage={
              enabledFilters.applicationStage ? applicationStage : undefined
            }
            applicationState={
              enabledFilters.applicationState ? applicationState : undefined
            }
            onDateRangeChange={handleDateRangeChange}
            onLimitChange={handleLimitChange}
            onHandledByChange={
              enabledFilters.handledBy ? handleHandledByChange : undefined
            }
            onApplicationStageChange={
              enabledFilters.applicationStage
                ? handleApplicationStageChange
                : undefined
            }
            onApplicationStateChange={
              enabledFilters.applicationState
                ? handleApplicationStateChange
                : undefined
            }
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      {/* Active filter chips */}
      {(dateRange?.from ||
        (enabledFilters.handledBy && handledBy.length > 0) ||
        (enabledFilters.applicationStage && applicationStage.length > 0) ||
        (enabledFilters.applicationState && applicationState)) && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {dateRange?.from && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium"
            >
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
          {enabledFilters.handledBy && handledBy.length > 0 && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium"
            >
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
          {enabledFilters.applicationStage && applicationStage.length > 0 && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium"
            >
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
          {enabledFilters.applicationState && applicationState && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium"
            >
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

      {/* Deadline filter badge */}
      {deadlineCategory && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <CalendarClock className="h-3 w-3" />
            Deadline: {deadlineCategoryLabel[deadlineCategory]}
            <button
              type="button"
              onClick={() => handleDeadlineCategoryClick(null)}
              className="ml-1 hover:text-destructive transition-colors"
              aria-label="Clear deadline filter"
            >
              <X className="h-3 w-3 text-gray-500 hover:text-destructive" />
            </button>
          </Badge>
        </div>
      )}

      {/* Error state */}
      {displayError && (
        <ErrorState
          title={
            isSearchMode
              ? `Error searching ${type === "spouse" ? "spouse " : ""}applications`
              : `Error loading ${type === "spouse" ? "spouse " : ""}applications`
          }
          message={
            displayError instanceof Error
              ? displayError.message
              : String(displayError)
          }
          hint={
            isSearchMode
              ? "Please check your search term and try again. Make sure you have at least 2 characters."
              : undefined
          }
        />
      )}

      {/* Search results header */}
      {isSearchMode && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-foreground">
            Search Results ({searchData?.data?.length ?? 0} results)
          </h3>
          <p className="text-sm text-gray-600">
            Searching for &quot;{searchQuery}&quot; in {searchType}
          </p>
          {!isSearchQueryLoading && searchData?.data?.length === 0 && (
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                No{type === "spouse" ? " spouse" : ""} applications found
                matching your search criteria. Try adjusting your search term or
                search type.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Applications table */}
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
            applications={displayData?.data ?? []}
            currentPage={page}
            limit={limit}
            isLoading={displayLoading}
            isSearchMode={isSearchMode}
            searchResults={searchData?.data ?? []}
            isSearchLoading={isSearchQueryLoading}
            isSpouseApplication={isSpouseApplication}
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
