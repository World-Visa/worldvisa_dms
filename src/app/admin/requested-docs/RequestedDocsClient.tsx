'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Globe, RefreshCw } from 'lucide-react';
import {
  useRequestedDocumentsToMePaginated,
  useMyRequestedDocumentsPaginated,
  useAllRequestedDocumentsPaginated,
  useRequestedDocumentsToMe,
  useMyRequestedDocuments,
  useAllRequestedDocuments,
} from '@/hooks/useRequestedDocuments';
import { RequestedDocumentsDataTable } from '@/components/requested-documents/RequestedDocumentsDataTable';
import { RequestedDocumentsFilters, RequestedDocumentsFilters as FiltersType } from '@/components/requested-documents/RequestedDocumentsFilters';
import { RequestedDocsStats } from '@/components/requested-documents/RequestedDocsStats';
import { ApplicationsPagination } from '@/components/applications/ApplicationsPagination';
import { RequestedDocumentViewSheet } from '@/components/requested-documents/RequestedDocumentViewSheet';
import { useAuth } from '@/hooks/useAuth';
import { RequestedDocument } from '@/lib/api/requestedDocuments';

type ActiveTab = 'requested-to-me' | 'my-requests' | 'all-requests';

export default function RequestedDocsClient() {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === 'master_admin';

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    isMasterAdmin ? 'all-requests' : 'requested-to-me'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    status: 'all',
    priority: '',
    requestedBy: '',
    requestedTo: '',
  });
  const [selectedDocument, setSelectedDocument] = useState<RequestedDocument | null>(null);

  const apiFilters =
    filters.status !== 'all'
      ? {
          status: filters.status,
          requested_by: filters.requestedBy || undefined,
          requested_to: filters.requestedTo || undefined,
        }
      : {
          requested_by: filters.requestedBy || undefined,
          requested_to: filters.requestedTo || undefined,
        };

  const finalApiFilters = activeTab === 'all-requests' ? apiFilters : {};

  const {
    data: requestedToMeData,
    isLoading: isLoadingRequestedToMe,
    refetch: refetchRequestedToMe,
  } = useRequestedDocumentsToMePaginated(currentPage, limit, {}, {
    enabled: activeTab === 'requested-to-me',
  });

  const {
    data: myRequestsData,
    isLoading: isLoadingMyRequests,
    refetch: refetchMyRequests,
  } = useMyRequestedDocumentsPaginated(currentPage, limit, {}, {
    enabled: activeTab === 'my-requests',
  });

  const {
    data: allRequestsData,
    isLoading: isLoadingAllRequests,
    refetch: refetchAllRequests,
  } = useAllRequestedDocumentsPaginated(currentPage, limit, finalApiFilters, {
    enabled: activeTab === 'all-requests' && isMasterAdmin,
  });

  // Stats queries - fetch all data for stats calculation
  const { data: allRequestedToMeStats, isLoading: isLoadingRequestedToMeCount } =
    useRequestedDocumentsToMe({
      enabled: activeTab === 'requested-to-me',
    });

  const { data: allMyRequestsStats, isLoading: isLoadingMyRequestsCount } =
    useMyRequestedDocuments({
      enabled: activeTab === 'my-requests',
    });

  const { data: allRequestsStatsData, isLoading: isLoadingAllRequestsCount } =
    useAllRequestedDocuments({
      enabled: activeTab === 'all-requests' && isMasterAdmin,
    });

  // Get current tab data and pagination
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'requested-to-me':
        return {
          documents: requestedToMeData?.data || [],
          pagination: requestedToMeData?.pagination,
          isLoading: isLoadingRequestedToMe,
          statsData: allRequestedToMeStats?.data || [],
          isLoadingStats: isLoadingRequestedToMeCount,
        };
      case 'my-requests':
        return {
          documents: myRequestsData?.data || [],
          pagination: myRequestsData?.pagination,
          isLoading: isLoadingMyRequests,
          statsData: allMyRequestsStats?.data || [],
          isLoadingStats: isLoadingMyRequestsCount,
        };
      case 'all-requests':
        return {
          documents: allRequestsData?.data || [],
          pagination: allRequestsData?.pagination,
          isLoading: isLoadingAllRequests,
          statsData: allRequestsStatsData?.data || [],
          isLoadingStats: isLoadingAllRequestsCount,
        };
      default:
        return {
          documents: [],
          pagination: undefined,
          isLoading: false,
          statsData: [],
          isLoadingStats: false,
        };
    }
  };

  const { documents, pagination, isLoading, statsData, isLoadingStats } = getCurrentTabData();

  // Calculate stats from current tab's full dataset
  const calculateStats = (docs: RequestedDocument[]) => {
    return docs.reduce(
      (acc, doc) => {
        if (doc.requested_review?.status === 'pending') acc.pendingRequests++;
        if (doc.requested_review?.status === 'reviewed') acc.reviewedRequests++;
        if (doc.isOverdue) acc.overdue++;
        return acc;
      },
      { pendingRequests: 0, reviewedRequests: 0, overdue: 0 }
    );
  };

  const stats = calculateStats(statsData);

  // Event handlers
  const handleRefresh = async () => {
    try {
      switch (activeTab) {
        case 'requested-to-me':
          await refetchRequestedToMe();
          break;
        case 'my-requests':
          await refetchMyRequests();
          break;
        case 'all-requests':
          if (isMasterAdmin) {
            await refetchAllRequests();
          }
          break;
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as ActiveTab);
    setCurrentPage(1);
  };

  const handleViewDocument = (document: RequestedDocument) => {
    setSelectedDocument(document);
  };

  const handleCloseSheet = () => {
    setSelectedDocument(null);
  };

  // Get counts for tab labels
  const getTabCount = (tab: ActiveTab) => {
    switch (tab) {
      case 'requested-to-me':
        return isLoadingRequestedToMeCount ? '...' : allRequestedToMeStats?.data?.length || 0;
      case 'my-requests':
        return isLoadingMyRequestsCount ? '...' : allMyRequestsStats?.data?.length || 0;
      case 'all-requests':
        return isLoadingAllRequestsCount ? '...' : allRequestsStatsData?.data?.length || 0;
      default:
        return 0;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Requested Documents</h2>
            <p className="text-gray-600">Manage and track document review requests.</p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <RequestedDocsStats
        pendingRequests={stats.pendingRequests}
        reviewedRequests={stats.reviewedRequests}
        overdue={stats.overdue}
      />

      <Card>
        <CardHeader>
          <CardTitle>Document Review Requests</CardTitle>
          <CardDescription>Manage documents requested for review</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList
              className={`grid w-full ${!isMasterAdmin ? 'grid-cols-2' : 'grid-cols-3'} h-12 mb-6`}
            >
              {isMasterAdmin && (
                <TabsTrigger value="all-requests" className="flex h-10 items-center gap-2">
                  <Globe className="h-4 w-4" />
                  All Requests ({getTabCount('all-requests')})
                </TabsTrigger>
              )}
              <TabsTrigger value="requested-to-me" className="flex h-10 items-center gap-2">
                <Eye className="h-4 w-4" />
                Requested to Me ({getTabCount('requested-to-me')})
              </TabsTrigger>
              <TabsTrigger value="my-requests" className="flex h-10 items-center gap-2">
                <FileText className="h-4 w-4" />
                My Requests ({getTabCount('my-requests')})
              </TabsTrigger>
            </TabsList>

            {isMasterAdmin && activeTab === 'all-requests' && (
              <TabsContent value="all-requests" className="space-y-4">
                <RequestedDocumentsFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onRefresh={handleRefresh}
                  isRefreshing={isLoading}
                  totalCount={pagination?.totalItems || 0}
                  filteredCount={documents.length}
                />

                <RequestedDocumentsDataTable
                  documents={documents}
                  isLoading={isLoading}
                  type="all-requests"
                  totalItems={pagination?.totalItems || 0}
                  onViewDocument={handleViewDocument}
                />

                {pagination && (
                  <ApplicationsPagination
                    currentPage={pagination.currentPage}
                    totalRecords={pagination.totalItems}
                    limit={limit}
                    onPageChange={handlePageChange}
                  />
                )}
              </TabsContent>
            )}

            {activeTab === 'requested-to-me' && (
              <TabsContent value="requested-to-me" className="space-y-4">
                <RequestedDocumentsDataTable
                  documents={documents}
                  isLoading={isLoading}
                  type="requested-to-me"
                  totalItems={pagination?.totalItems || 0}
                  onViewDocument={handleViewDocument}
                />

                {pagination && (
                  <ApplicationsPagination
                    currentPage={pagination.currentPage}
                    totalRecords={pagination.totalItems}
                    limit={limit}
                    onPageChange={handlePageChange}
                  />
                )}
              </TabsContent>
            )}

            {activeTab === 'my-requests' && (
              <TabsContent value="my-requests" className="space-y-4">
                <RequestedDocumentsDataTable
                  documents={documents}
                  isLoading={isLoading}
                  type="my-requests"
                  totalItems={pagination?.totalItems || 0}
                  onViewDocument={handleViewDocument}
                />

                {pagination && (
                  <ApplicationsPagination
                    currentPage={pagination.currentPage}
                    totalRecords={pagination.totalItems}
                    limit={limit}
                    onPageChange={handlePageChange}
                  />
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {selectedDocument && (
        <RequestedDocumentViewSheet
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={handleCloseSheet}
          type={activeTab}
        />
      )}
    </main>
  );
}
