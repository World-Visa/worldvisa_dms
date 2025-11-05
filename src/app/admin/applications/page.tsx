'use client';

import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy, memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApplications } from '@/hooks/useApplications';
import { useSearchApplications } from '@/hooks/useSearchApplications';
import { useDebounce } from '@/hooks/useDebounce';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useQueryString } from '@/hooks/useQueryString';
import { ApplicationsFilters } from '@/components/applications/ApplicationsFilters';
import { ApplicationsPagination } from '@/components/applications/ApplicationsPagination';
import { ApplicationsTableSkeleton, SearchResultsSkeleton } from '@/components/applications/ApplicationsTableSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, RefreshCw, Users } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Lazy load heavy components for better performance
const LazyApplicationsTable = lazy(() =>
  import('@/components/applications/ApplicationsTable').then(module => ({
    default: module.ApplicationsTable
  }))
);

const AllApplicationsPage = memo(function AllApplicationsPage() {
  const { queryParams, updateQuery } = useQueryString();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'phone' | 'email'>('name');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize recentActivity from URL params, default to false
  const [recentActivity, setRecentActivity] = useState(() => {
    return queryParams.recentActivity === 'true' || queryParams.recentActivity === true;
  });

  // Separate state for the actual search query that triggers API calls
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search input for better performance
  const debouncedSearch = useDebounce(search, 300);

  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('AllApplicationsPage');

  // Check if we're in search mode
  const isSearchMode = searchQuery.trim() !== '';

  const filters = useMemo(() => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
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
      // Remove search from regular filters since we have a separate search endpoint
    };

    return filterParams;
  }, [page, limit, dateRange, recentActivity]);

  // Fetch regular applications (only when not in search mode)
  const { data, isLoading, error } = useApplications(filters);

  // Create search params based on search type and value
  const searchParamsForAPI = useMemo(() => {
    if (!searchQuery.trim()) return {};

    const params: Record<string, string> = {};
    params[searchType] = searchQuery.trim();
    return params;
  }, [searchQuery, searchType]);

  const { data: searchData, isLoading: isSearchQueryLoading, error: searchQueryError } = useSearchApplications(searchParamsForAPI);


  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSearchTypeChange = useCallback((type: 'name' | 'phone' | 'email') => {
    setSearchType(type);
  }, []);

  const handleSearchClick = useCallback(async () => {
    if (search.trim()) {
      await measureAsync(async () => {
        setSearchQuery(search.trim());
        setPage(1);
      }, 'searchApplications');
    }
  }, [search, measureAsync]);

  // Auto-search when debounced search changes
  useEffect(() => {
    if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
      setSearchQuery(debouncedSearch.trim());
      setPage(1);
    } else if (debouncedSearch.trim() === '') {
      setSearchQuery('');
    }
  }, [debouncedSearch]);

  // Sync recentActivity state with URL params
  useEffect(() => {
    const urlRecentActivity = queryParams.recentActivity === 'true' || queryParams.recentActivity === true;
    if (urlRecentActivity !== recentActivity) {
      setRecentActivity(urlRecentActivity);
    }
  }, [queryParams.recentActivity, recentActivity]);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setSearchQuery('');
    setSearchType('name');
    setDateRange(undefined);
    setRecentActivity(false);
    setPage(1);

    // Clear URL params when clearing filters
    updateQuery({ recentActivity: undefined });
  }, [updateQuery]);

  const handleRecentActivityToggle = useCallback(() => {
    const newRecentActivity = !recentActivity;
    setRecentActivity(newRecentActivity);
    setPage(1);

    // Update URL params to persist the state
    updateQuery({ recentActivity: newRecentActivity ? 'true' : undefined });
  }, [recentActivity, updateQuery]);

  // Add keyboard shortcut for search (Enter key)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      handleSearchClick();
    }
  }, [search, handleSearchClick]);

  // Handle refresh functionality
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // Clear all application-related cache
      await queryClient.invalidateQueries({
        queryKey: ['applications']
      });

      // Clear search applications cache
      await queryClient.invalidateQueries({
        queryKey: ['search-applications']
      });

      // Force refetch current queries
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ['applications', filters]
        }),
        searchQuery.trim() && queryClient.refetchQueries({
          queryKey: ['search-applications', searchParamsForAPI]
        })
      ].filter(Boolean));

    } catch (error) {
      console.error('Error refreshing applications:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, filters, searchQuery, searchParamsForAPI]);

  const totalApplications = data?.pagination.totalRecords || 0;

  const displayError = isSearchMode ? searchQueryError : error;
  const displayLoading = isLoading;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col w-full sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-lexend mb-2 flex items-center gap-2">
            Visa Applications
          </h2>
          <p className="text-gray-600">
            Manage and review all visa applications assigned to you.
          </p>
        </div>
        <div className="w-full sm:w-auto sm:max-w-lg">
          <ApplicationsFilters
            search={search}
            searchType={searchType}
            dateRange={dateRange}
            limit={limit}
            isSearchMode={isSearchMode}
            onSearchChange={handleSearchChange}
            onSearchTypeChange={handleSearchTypeChange}
            onSearchClick={handleSearchClick}
            onDateRangeChange={handleDateRangeChange}
            onLimitChange={handleLimitChange}
            onClearFilters={handleClearFilters}
            onKeyPress={handleKeyPress}
          />
          <div className="mt-2">
            <Badge variant="outline">
              Total applications:&nbsp;
              {displayLoading ? '...' : totalApplications.toLocaleString()}
            </Badge>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="mb-6">

        <div className='flex justify-between gap-2'>
          <div className='flex gap-2'>
            <Button
              variant={!recentActivity ? "default" : "outline"}
              className='rounded-full py-3 px-6 cursor-pointer'
              onClick={handleRecentActivityToggle}
            >
              All applications
            </Button>
            <Button
              variant={recentActivity ? "default" : "outline"}
              className='rounded-full py-3 px-6 cursor-pointer'
              onClick={handleRecentActivityToggle}
            >
              Recent activities
            </Button>
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
      </div>

      {/* Error State */}
      {displayError && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">
                {isSearchMode ? 'Error searching applications' : 'Error loading applications'}
              </p>
              <p className="text-sm mt-1">{displayError instanceof Error ? displayError.message : displayError}</p>
              {isSearchMode && (
                <p className="text-xs mt-2 text-gray-500">
                  Please check your search term and try again. Make sure you have at least 2 characters.
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
                No applications found matching your search criteria. Try adjusting your search term or search type.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Applications Table */}
      <div className="mb-6">
        <Suspense fallback={isSearchMode ? <SearchResultsSkeleton /> : <ApplicationsTableSkeleton />}>
          <LazyApplicationsTable
            applications={data?.data || []}
            currentPage={page}
            limit={limit}
            isLoading={displayLoading}
            isSearchMode={isSearchMode}
            searchResults={searchData?.data || []}
            isSearchLoading={isSearchQueryLoading}
          />
        </Suspense>
      </div>

      {/* Pagination (only show when not in search mode) */}
      {!isSearchMode && data && data.pagination.totalPages > 1 && (
        <ApplicationsPagination
          currentPage={page}
          totalRecords={data.pagination.totalRecords}
          limit={limit}
          onPageChange={handlePageChange}
        />
      )}
    </main>
  );
});

export default AllApplicationsPage;