'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { useChecklistRequests } from '@/hooks/useChecklistRequests';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { ChecklistRequestsTable } from '@/components/applications/ChecklistRequestsTable';
import { ApplicationsPagination } from '@/components/applications/ApplicationsPagination';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChecklistRequestsPage = memo(function ChecklistRequestsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('ChecklistRequestsPage');

  // Fetch checklist requests data with optimized settings
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useChecklistRequests({
    page,
    limit,
    staleTime: 5 * 60 * 1000, // 5 minutes - increased for better performance
  });

  // Memoized page change handler with debouncing
  const handlePageChange = useCallback(async (newPage: number) => {
    if (newPage === page) return; // Prevent unnecessary calls
    
    await measureAsync(async () => {
      setPage(newPage);
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 'pageChange');
  }, [measureAsync, page]);

  // Optimized refresh handler with loading state
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    try {
      await measureAsync(async () => {
        await refetch();
      }, 'refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, measureAsync, isRefreshing]);

  // Memoized calculations with early returns for better performance
  const { totalRequests, currentRequests } = useMemo(() => {
    const rawRequests = data?.data || [];
    
    // Early return if no data
    if (rawRequests.length === 0) {
      return {
        totalRequests: 0,
        currentRequests: []
      };
    }

    // Filter valid requests in a single pass
    const valid = rawRequests.filter(req => 
      req.id && 
      req.id.trim() !== '' && 
      req.Checklist_Requested === true
    );

    return {
      totalRequests: valid.length,
      currentRequests: valid
    };
  }, [data?.data]);

  // Memoized loading state
  const isDataLoading = useMemo(() => isLoading || isRefreshing, [isLoading, isRefreshing]);

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-lexend mb-2 flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Checklist Requests
              </h2>
              <p className="text-gray-600">
                Applications that have requested document checklists for processing.
              </p>
            </div>

            {/* Stats Card with Refresh Button - Better Layout */}
            <div className="flex flex-col pt-0 md:pt-10 sm:flex-row items-start sm:items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isDataLoading}
                className="flex items-center gap-2 self-start sm:self-center"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              
              <Card className="w-full sm:w-64 border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isDataLoading ? '...' : totalRequests.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>


        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50/50">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Loading Error
                </h3>
                <p className="text-red-700 mb-4">
                  {error instanceof Error ? error.message : 'Failed to load checklist requests'}
                </p>
                <Button
                  onClick={handleRefresh}
                  disabled={isDataLoading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isDataLoading && !error && currentRequests.length === 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  No Checklist Requests
                </h3>
                <p className="text-blue-700">
                  There are currently no checklist requests to display. Applications will appear here once they request checklists.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checklist Requests Table */}
        {!error && (
          <div className="mb-8">
            <ChecklistRequestsTable
              requests={currentRequests}
              currentPage={page}
              limit={limit}
              isLoading={isDataLoading}
            />
          </div>
        )}

        {/* Pagination */}
        {!isDataLoading && !error && totalRequests > limit && (
          <div className="flex justify-center">
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <ApplicationsPagination
                  currentPage={page}
                  totalRecords={totalRequests}
                  limit={limit}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
});

export default ChecklistRequestsPage;
