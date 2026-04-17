"use client";

import { memo, Suspense, lazy, useEffect } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDeadlineStats } from "@/hooks/useDeadlineStats";
import {
  useApplicationsListState,
} from "@/hooks/useApplicationsListState";
import { useCountryApplicationTotals } from "@/hooks/useCountryApplicationTotals";
import { ApplicationsFilterBar } from "@/components/applications/ApplicationsFilters";
import { ApplicationsTableLoadingState } from "@/components/applications/ApplicationsTableLoadingState";
import { ListNoResults } from "@/components/applications/list-no-results";
import { ErrorState } from "@/components/ui/ErrorState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { COUNTRIES, COUNTRY_IMAGE_URLS } from "@/lib/applications/utils";
import { ROLES } from "@/lib/roles";
import { API_ENDPOINTS } from "@/lib/config/api";
import type {
  Country,
  ApplicationsFilters as ApplicationsFiltersType,
  ApplicationsResponse,
  SearchParams,
  EnabledFilters,
} from "@/types/applications";

const LazyApplicationsTable = lazy(() =>
  import("@/components/applications/ApplicationsTable").then((module) => ({
    default: module.ApplicationsTable,
  })),
);


interface CountryTabNavProps {
  selectedCountry: Country;
  countries: readonly Country[];
  countryTotals: Record<Country, number | undefined>;
  onCountryChange: (country: Country) => void;
}

function CountryTabNav({
  selectedCountry,
  countries,
  countryTotals,
  onCountryChange,
}: CountryTabNavProps) {
  return (
    <div className="mb-6">
      <div className="flex border-b border-gray-200">
        {countries.map((country) => {
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


interface ApplicationsListPageProps {
  useApplicationsHook: (
    filters: ApplicationsFiltersType,
  ) => UseQueryResult<ApplicationsResponse>;
  useSearchHook: (
    params: SearchParams,
  ) => UseQueryResult<ApplicationsResponse>;
  type: "visa" | "spouse";
  getTitle: (country: Country) => string;
  enabledFilters: EnabledFilters;
  isSpouseApplication?: boolean;
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
  onRefresh: _onRefresh,
  isRefreshing: _isRefreshing,
}: ApplicationsListPageProps) {
  const { user } = useAuth();
  const canView =
    user?.role === ROLES.MASTER_ADMIN || user?.role === ROLES.TEAM_LEADER;

  const state = useApplicationsListState({
    componentName: type === "visa" ? "ApplicationsClient" : "SpouseSkillAssessmentApplications",
    availableCountries: type === "spouse" ? (["Australia"] as const) : COUNTRIES,
  });

  const {
    selectedCountry,
    page,
    search,
    searchQuery,
    handledBy,
    applicationStage,
    applicationState,
    deadlineCategory,
    serviceType,
    isSearchMode,
    filters,
    searchParamsForAPI,
    handleCountryChange,
    handlePageChange,
    handleSearchChange,
    handleHandledByChange,
    handleApplicationStageChange,
    handleApplicationStateChange,
    handleDeadlineCategoryClick,
    handleServiceTypeChange,
    handleClearFilters,
  } = state;

  const allowedCountries = type === "spouse" ? (["Australia"] as const) : COUNTRIES;

  const { countryTotals, visibleCountries } = useCountryApplicationTotals({
    countries: allowedCountries,
    getUrl: (country) => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "1");
      params.set("country", country);

      if (type === "spouse") {
        return API_ENDPOINTS.VISA_APPLICATIONS.SPOUSE.LIST(params.toString());
      }
      return API_ENDPOINTS.VISA_APPLICATIONS.LIST(params.toString());
    },
    queryKeyPrefix:
      type === "spouse"
        ? (["spouse-applications", "totals"] as const)
        : (["applications", "totals"] as const),
  });

  // If the currently-selected country is hidden (0 total), fall back.
  useEffect(() => {
    if (visibleCountries.length === 0) return;
    if (!visibleCountries.includes(selectedCountry)) {
      state.handleCountryChange(visibleCountries[0]);
    }
  }, [visibleCountries, selectedCountry, state]);

  // ── Main data query ───────────────────────────────────────────────────────
  const { data: regularData, isFetching, error } = useApplicationsHook(filters);

  // ── Deadline-filtered data ────────────────────────────────────────────────
  const { data: deadlineData, isLoading: isDeadlineLoading } = useDeadlineStats(
    type,
    canView && !!deadlineCategory,
    deadlineCategory,
    page,
    20,
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
          limit: 20,
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

  const isEmptySearchResults =
    isSearchMode &&
    !isSearchQueryLoading &&
    (searchData?.data?.length ?? 0) === 0;

  const isEmptyNonSearchResults =
    !isSearchMode && !displayLoading && (displayData?.data?.length ?? 0) === 0;

  return (
    <>
      <CountryTabNav
        selectedCountry={selectedCountry}
        countries={visibleCountries}
        countryTotals={countryTotals}
        onCountryChange={handleCountryChange}
      />

      {/* Title */}
      <div className="mb-2 flex w-full items-center gap-4 md:justify-between flex-col md:flex-row">
        <h2 className="text-xl font-medium text-foreground">
          {getTitle(selectedCountry)}
        </h2>
        <ApplicationsFilterBar
          search={search}
          applicationStage={enabledFilters.applicationStage ? applicationStage : []}
          applicationState={enabledFilters.applicationState ? applicationState : undefined}
          handledBy={enabledFilters.handledBy ? handledBy : []}
          deadlineCategory={enabledFilters.deadline ? deadlineCategory : null}
          serviceType={enabledFilters.serviceType ? serviceType : undefined}
          enabledFilters={enabledFilters}
          onSearchChange={handleSearchChange}
          onApplicationStageChange={handleApplicationStageChange}
          onApplicationStateChange={handleApplicationStateChange}
          onHandledByChange={handleHandledByChange}
          onDeadlineCategoryChange={handleDeadlineCategoryClick}
          onServiceTypeChange={handleServiceTypeChange}
          onClearFilters={handleClearFilters}
          isLoading={displayLoading}
        />
      </div>

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

      {isEmptySearchResults ? (
        <div className="py-16">
          <ListNoResults
            title="No matching applications found"
            description="We couldn't find any applications that match your search criteria. Try adjusting your filters or assign a new application."
            onClearFilters={handleClearFilters}
          />
        </div>
      ) : isEmptyNonSearchResults ? (
        <div className="py-16">
          <ListNoResults
            title="No applications assigned to you yet"
            description="Once applications are assigned to you, they'll show up here."
          />
        </div>
      ) : (
        /* Applications table */
        <div className="mb-6">
          <Suspense fallback={<ApplicationsTableLoadingState />}>
            <LazyApplicationsTable
              applications={displayData?.data ?? []}
              currentPage={page}
              limit={20}
              isLoading={displayLoading}
              isSearchMode={isSearchMode}
              searchResults={searchData?.data ?? []}
              isSearchLoading={isSearchQueryLoading}
              isSpouseApplication={isSpouseApplication}
              totalCount={displayData?.pagination.totalRecords}
              onPageChange={handlePageChange}
            />
          </Suspense>
        </div>
      )}
    </>
  );
});
