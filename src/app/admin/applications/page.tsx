'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useApplications } from '@/hooks/useApplications';
import { useSearchApplications } from '@/hooks/useSearchApplications';
import { useDebounce } from '@/hooks/useDebounce';
import { ApplicationsFilters } from '@/components/applications/ApplicationsFilters';
import { ApplicationsTable } from '@/components/applications/ApplicationsTable';
import { ApplicationsPagination } from '@/components/applications/ApplicationsPagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users } from 'lucide-react';
import { DateRange } from 'react-day-picker';

export default function AllApplicationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'phone' | 'email'>('name');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Separate state for the actual search query that triggers API calls
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search input for better performance
  const debouncedSearch = useDebounce(search, 300);
  
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
      // Remove search from regular filters since we have a separate search endpoint
    };
    
    return filterParams;
  }, [page, limit, dateRange]);

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

  const handleSearchClick = useCallback(() => {
    if (search.trim()) {
      setSearchQuery(search.trim());
      setPage(1);
    }
  }, [search]);

  // Auto-search when debounced search changes
  useEffect(() => {
    if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
      setSearchQuery(debouncedSearch.trim());
      setPage(1);
    } else if (debouncedSearch.trim() === '') {
      setSearchQuery('');
    }
  }, [debouncedSearch]);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setSearchQuery('');
    setSearchType('name');
    setDateRange(undefined);
    setPage(1);
  }, []);

  // Add keyboard shortcut for search (Enter key)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      handleSearchClick();
    }
  }, [search, handleSearchClick]);

  const totalApplications = data?.pagination.totalRecords || 0;
  
  const displayError = isSearchMode ? searchQueryError : error;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 font-lexend mb-2 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Visa Applications
        </h2>
        <p className="text-gray-600">
          Manage and review all visa applications assigned to you.
        </p>
      </div>

      {/* Total Applications Count */}
      <div className='flex justify-end'>
        <Card className="mb-6 max-w-xs w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {isLoading ? '...' : totalApplications.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? 'Loading...' : 'Applications assigned to you'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
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
        <ApplicationsTable
          applications={data?.data || []}
          currentPage={page}
          limit={limit}
          isLoading={isLoading}
          isSearchMode={isSearchMode}
          searchResults={searchData?.data || []}
          isSearchLoading={isSearchQueryLoading}
        />
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
}