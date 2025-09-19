'use client';

import React, { useState, useCallback, memo } from 'react';
import { useChecklistRequests } from '@/hooks/useChecklistRequests';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { ChecklistRequestsTable } from '@/components/applications/ChecklistRequestsTable';
import { ApplicationsPagination } from '@/components/applications/ApplicationsPagination';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, } from 'lucide-react';

const ChecklistRequestsPage = memo(function ChecklistRequestsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('ChecklistRequestsPage');

  // Fetch checklist requests data
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useChecklistRequests({
    page,
    limit,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handlePageChange = useCallback(async (newPage: number) => {
    await measureAsync(async () => {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 'pageChange');
  }, [measureAsync]);


  const handleRefresh = useCallback(async () => {
    await measureAsync(async () => {
      await refetch();
    }, 'refresh');
  }, [refetch, measureAsync]);

  // Memoized calculations
  const allRequests = data?.data || [];
  const validRequests = allRequests.filter(req => req.id && req.id.trim() !== '' && req.Checklist_Requested === true);
  const totalRequests = validRequests.length; // Use actual valid count instead of API pagination
  const currentRequests = validRequests;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 font-lexend mb-2 flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Checklist Requests
              </h2>
              <p className="text-gray-600">
                Applications that have requested document checklists for processing.
              </p>
            </div>

            {/* Stats Card */}
            <div className="hidden lg:block pt-8">
              <Card className="w-64 border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isLoading ? '...' : totalRequests.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Stats Card */}
        <div className="lg:hidden mb-6">
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Requests</p>
                  <p className="text-xl font-bold text-gray-900">
                    {isLoading ? '...' : totalRequests.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-full">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && currentRequests.length === 0 && (
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
        <div className="mb-8">
          <ChecklistRequestsTable
            requests={currentRequests}
            currentPage={page}
            limit={limit}
            isLoading={isLoading}
          />
        </div>

        {/* Pagination */}
        {!isLoading && !error && totalRequests > limit && (
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
