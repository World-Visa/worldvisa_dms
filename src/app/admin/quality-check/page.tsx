'use client';

import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useQualityCheckApplications, useSearchQualityCheckApplications } from '@/hooks/useQualityCheckApplications';
import { useDebounce } from '@/hooks/useDebounce';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { QualityCheckDataTable } from '@/components/quality-check/QualityCheckDataTable';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { DateRange } from 'react-day-picker';

const QualityCheckPage = memo(function QualityCheckPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'email' | 'phone'>('name');
  const [status, setStatus] = useState('all');
  const [handledBy, setHandledBy] = useState('');
  const [qualityCheckFrom, setQualityCheckFrom] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Separate state for the actual search query that triggers API calls
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search input for better performance
  const debouncedSearch = useDebounce(search, 300);

  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('QualityCheckPage');

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
      status: status !== 'all' ? status : undefined,
      handledBy: handledBy || undefined,
      qualityCheckFrom: qualityCheckFrom || undefined,
      startDate,
      endDate,
    };

    return filterParams;
  }, [page, limit, status, handledBy, qualityCheckFrom, dateRange]);

  // Fetch regular quality check applications (only when not in search mode)
  const { data, isLoading, error } = useQualityCheckApplications(filters);

  // Create search params based on search type and value
  const searchParamsForAPI = useMemo(() => {
    if (!searchQuery.trim()) return {};

    const params: Record<string, string> = {};
    params[searchType] = searchQuery.trim();
    return params;
  }, [searchQuery, searchType]);

  const { data: searchData, isLoading: isSearchQueryLoading, error: searchQueryError } = useSearchQualityCheckApplications(searchParamsForAPI);

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

  const handleSearchTypeChange = useCallback((type: 'name' | 'email' | 'phone') => {
    setSearchType(type);
  }, []);

  const handleSearchClick = useCallback(async () => {
    if (search.trim()) {
      await measureAsync(async () => {
        setSearchQuery(search.trim());
        setPage(1);
      }, 'searchQualityCheckApplications');
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

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  }, []);

  const handleHandledByChange = useCallback((newHandledBy: string) => {
    setHandledBy(newHandledBy);
    setPage(1);
  }, []);

  const handleQualityCheckFromChange = useCallback((newQualityCheckFrom: string) => {
    setQualityCheckFrom(newQualityCheckFrom);
    setPage(1);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setSearchQuery('');
    setSearchType('name');
    setStatus('all');
    setHandledBy('');
    setQualityCheckFrom('');
    setDateRange(undefined);
    setPage(1);
  }, []);

  // Add keyboard shortcut for search (Enter key)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      handleSearchClick();
    }
  }, [search, handleSearchClick]);

  const totalApplications = isSearchMode
    ? (Array.isArray(searchData?.data) ? searchData.data.length : searchData?.data ? 1 : 0)
    : (data?.pagination?.totalItems ?? 0);

  const displayError = isSearchMode ? searchQueryError : error;

  return (
    <main className="min-h-screen bg-neutral-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Simple, professional */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
                Quality Check Applications
              </h1>
              <p className="mt-0.5 text-sm text-neutral-500">
                Manage and review applications pending quality verification.
              </p>
            </div>
            <div className="text-sm text-neutral-500 tabular-nums">
              {(isSearchMode ? isSearchQueryLoading : isLoading) ? (
                <span className="animate-pulse">—</span>
              ) : (
                <>
                  <span className="font-medium text-neutral-700">{totalApplications.toLocaleString()}</span>
                  <span className="ml-1">{isSearchMode ? 'results' : 'applications'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {/* <div className="mb-8">
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <QualityCheckFilters
                search={search}
                searchType={searchType}
                status={status}
                handledBy={handledBy}
                qualityCheckFrom={qualityCheckFrom}
                dateRange={dateRange}
                limit={limit}
                isSearchMode={isSearchMode}
                onSearchChange={handleSearchChange}
                onSearchTypeChange={handleSearchTypeChange}
                onSearchClick={handleSearchClick}
                onStatusChange={handleStatusChange}
                onHandledByChange={handleHandledByChange}
                onQualityCheckFromChange={handleQualityCheckFromChange}
                onDateRangeChange={handleDateRangeChange}
                onLimitChange={handleLimitChange}
                onClearFilters={handleClearFilters}
                onKeyPress={handleKeyPress}
              />
            </CardContent>
          </Card>
        </div> */}

        {/* Error State */}
        {displayError && (
          <Card className="mb-6 border-red-200 bg-red-50/50">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  {isSearchMode ? 'Search Error' : 'Loading Error'}
                </h3>
                <p className="text-red-700 mb-2">
                  {displayError instanceof Error ? displayError.message : displayError}
                </p>
                {isSearchMode && (
                  <p className="text-sm text-red-600">
                    Please check your search term and try again. Make sure you have at least 2 characters.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results Header */}
        {isSearchMode && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">
                    Search Results
                  </h3>
                  <p className="text-blue-700">
                    Found {Array.isArray(searchData?.data) ? searchData.data.length : (searchData?.data ? 1 : 0)} results for &quot;{searchQuery}&quot; in {searchType}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              {!isSearchQueryLoading && (!searchData?.data || (Array.isArray(searchData.data) && searchData.data.length === 0)) && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    No applications found matching your search criteria. Try adjusting your search term or search type.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* DataTable with built-in pagination */}
        {!isSearchMode ? (
          <QualityCheckDataTable
            applications={data?.data || []}
            isLoading={isLoading}
            totalItems={data?.pagination?.totalItems ?? 0}
            currentPage={page}
            limit={limit}
            onPageChange={handlePageChange}
          />
        ) : (
          <QualityCheckDataTable
            applications={searchData?.data ? (Array.isArray(searchData.data) ? searchData.data : [searchData.data]) : []}
            isLoading={isSearchQueryLoading}
            totalItems={Array.isArray(searchData?.data) ? searchData.data.length : (searchData?.data ? 1 : 0)}
            currentPage={1}
            limit={limit}
            onPageChange={() => {}}
          />
        )}
      </div>
    </main>
  );
});

export default QualityCheckPage;