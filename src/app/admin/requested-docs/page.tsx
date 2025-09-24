'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Eye, Globe, RefreshCw } from 'lucide-react';
import { useRequestedDocumentsToMePaginated, useMyRequestedDocumentsPaginated, useRequestedDocumentsToMe, useMyRequestedDocuments, useAllRequestedDocumentsPaginated, useAllRequestedDocuments } from '@/hooks/useRequestedDocuments';
import { RequestedDocumentsTable } from '@/components/requested-documents/RequestedDocumentsTable';
import { RequestedDocumentsFilters, RequestedDocumentsFilters as FiltersType } from '@/components/requested-documents/RequestedDocumentsFilters';
import { RequestedDocsStats } from '@/components/requested-documents/RequestedDocsStats';
import { ApplicationsPagination } from '@/components/applications/ApplicationsPagination';
import { useAuth } from '@/hooks/useAuth';
import { RequestedDocument } from '@/lib/api/requestedDocuments';
import { Button } from '@/components/ui/button';

export default function RequestedDocsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'requested-to-me' | 'my-requests' | 'all-requests'>(
        user?.role === 'supervisor' ? 'requested-to-me' : 
        user?.role === 'master_admin' ? 'all-requests' : 'requested-to-me'
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [filters, setFilters] = useState<FiltersType>({
        search: '',
        status: 'all',
        priority: '',
        requestedBy: '',
        requestedTo: ''
    });

    // Check if user is master admin
    const isMasterAdmin = user?.role === 'master_admin';

    // Memoize filter parameters to prevent unnecessary re-renders
    const apiFilters = useMemo(() => ({
        status: (filters.status && filters.status !== 'all') ? filters.status : undefined,
        requested_by: filters.requestedBy || undefined,
        requested_to: filters.requestedTo || undefined,
    }), [filters.status, filters.requestedBy, filters.requestedTo]);

    // Only apply filters for "All Requests" tab
    const shouldUseFilters = activeTab === 'all-requests';
    const finalApiFilters = useMemo(() => 
        shouldUseFilters ? apiFilters : {}, 
        [shouldUseFilters, apiFilters]
    );

    // Conditional data fetching - only fetch what's needed for the active tab
    const { 
        data: requestedToMeData, 
        isLoading: isLoadingRequestedToMe, 
        refetch: refetchRequestedToMe
    } = useRequestedDocumentsToMePaginated(
        currentPage, 
        limit, 
        {}
    );

    const { 
        data: myRequestsData, 
        isLoading: isLoadingMyRequests, 
        refetch: refetchMyRequests
    } = useMyRequestedDocumentsPaginated(
        currentPage, 
        limit, 
        {}
    );

    // Always fetch total counts for all tabs to display correct tab numbers
    const { data: allRequestedToMeData } = useRequestedDocumentsToMe();
    const { data: allMyRequestsData } = useMyRequestedDocuments();
    const { data: allRequestsDataForStats } = useAllRequestedDocuments();
    
    // Fetch all requested documents (master admin only) - with filters only for this tab
    const { 
        data: allRequestsData, 
        isLoading: isLoadingAllRequests, 
        refetch: refetchAllRequests
    } = useAllRequestedDocumentsPaginated(
        currentPage, 
        limit, 
        finalApiFilters
    );

    // Get documents and pagination data (server-side filtering) - only for active tab
    const requestedToMeDocuments = useMemo(() => 
        activeTab === 'requested-to-me' ? (requestedToMeData?.data || []) : [], 
        [requestedToMeData?.data, activeTab]
    );
    const myRequestsDocuments = useMemo(() => 
        activeTab === 'my-requests' ? (myRequestsData?.data || []) : [], 
        [myRequestsData?.data, activeTab]
    );
    const allRequestsDocuments = useMemo(() => 
        activeTab === 'all-requests' ? (allRequestsData?.data || []) : [], 
        [allRequestsData?.data, activeTab]
    );
    
    const requestedToMePagination = activeTab === 'requested-to-me' ? requestedToMeData?.pagination : undefined;
    const myRequestsPagination = activeTab === 'my-requests' ? myRequestsData?.pagination : undefined;
    const allRequestsPagination = activeTab === 'all-requests' ? allRequestsData?.pagination : undefined;

    // Calculate stats based on active tab - only when data is available
    const stats = useMemo(() => {
        let sourceData: RequestedDocument[] = [];
        
        switch (activeTab) {
            case 'requested-to-me':
                sourceData = allRequestedToMeData?.data || [];
                break;
            case 'my-requests':
                sourceData = allMyRequestsData?.data || [];
                break;
            case 'all-requests':
                sourceData = allRequestsDataForStats?.data || [];
                break;
            default:
                sourceData = [];
        }
        
        // Early return if no data to avoid unnecessary calculations
        if (sourceData.length === 0) {
            return {
                pendingRequests: 0,
                reviewedRequests: 0,
                overdue: 0,
            };
        }
        
        // Use reduce for better performance with large datasets
        const statsResult = sourceData.reduce((acc, doc) => {
            if (doc.requested_review?.status === 'pending') acc.pendingRequests++;
            if (doc.requested_review?.status === 'reviewed') acc.reviewedRequests++;
            if (doc.isOverdue) acc.overdue++;
            return acc;
        }, { pendingRequests: 0, reviewedRequests: 0, overdue: 0 });
        
        return statsResult;
    }, [activeTab, allRequestedToMeData?.data, allMyRequestsData?.data, allRequestsDataForStats?.data]);


    // Memoize handlers to prevent unnecessary re-renders
    const handleRefresh = useCallback(async () => {
        try {
            // Only refresh the active tab's data
            const refreshPromises = [];
            
            if (activeTab === 'requested-to-me') {
                refreshPromises.push(refetchRequestedToMe());
            } else if (activeTab === 'my-requests') {
                refreshPromises.push(refetchMyRequests());
            } else if (activeTab === 'all-requests' && isMasterAdmin) {
                refreshPromises.push(refetchAllRequests());
            }
            
            await Promise.all(refreshPromises);
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }, [activeTab, refetchRequestedToMe, refetchMyRequests, refetchAllRequests, isMasterAdmin]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleFiltersChange = useCallback((newFilters: FiltersType) => {
        setFilters(newFilters);
        setCurrentPage(1); 
    }, []);

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value as typeof activeTab);
        setCurrentPage(1); // Reset page when switching tabs
    }, []);


    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Requested Documents
                        </h2>
                        <p className="text-gray-600">
                            Manage and track document review requests.
                        </p>
                    </div>
                    
                    {/* Global Refresh Button */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoadingRequestedToMe || isLoadingMyRequests || isLoadingAllRequests}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Refresh All</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <RequestedDocsStats 
                pendingRequests={stats.pendingRequests}
                reviewedRequests={stats.reviewedRequests}
                overdue={stats.overdue}
            />

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Document Review Requests</CardTitle>
                    <CardDescription>
                        Manage documents requested for review
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList className={`grid w-full ${!isMasterAdmin ? 'grid-cols-2' : 'grid-cols-3'} h-12 mb-6`}>
                            {isMasterAdmin && (
                                <TabsTrigger value="all-requests" className="flex h-10 items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    All Requests ({allRequestsDataForStats?.data?.length || 0})
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="requested-to-me" className="flex h-10 items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Requested to Me ({allRequestedToMeData?.data?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="my-requests" className="flex h-10 items-center gap-2">
                                <FileText className="h-4 w-4" />
                                My Requests ({allMyRequestsData?.data?.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        {isMasterAdmin && activeTab === 'all-requests' && (
                            <TabsContent value="all-requests" className="space-y-4">
                                <RequestedDocumentsFilters
                                    filters={filters}
                                    onFiltersChange={handleFiltersChange}
                                    onRefresh={handleRefresh}
                                    isRefreshing={isLoadingAllRequests}
                                    totalCount={allRequestsPagination?.totalItems || 0}
                                    filteredCount={allRequestsDocuments.length}
                                />
                                
                                <RequestedDocumentsTable
                                    documents={allRequestsDocuments}
                                    isLoading={isLoadingAllRequests}
                                    type="all-requests"
                                />

                                {/* Pagination */}
                                {allRequestsPagination && (
                                    <ApplicationsPagination
                                        currentPage={allRequestsPagination.currentPage}
                                        totalRecords={allRequestsPagination.totalItems}
                                        limit={limit}
                                        onPageChange={handlePageChange}
                                    />
                                )}
                            </TabsContent>
                        )}

                        {activeTab === 'requested-to-me' && (
                            <TabsContent value="requested-to-me" className="space-y-4">
                                <RequestedDocumentsTable
                                    documents={requestedToMeDocuments}
                                    isLoading={isLoadingRequestedToMe}
                                    type="requested-to-me"
                                />

                                {/* Pagination */}
                                {requestedToMePagination && (
                                    <ApplicationsPagination
                                        currentPage={requestedToMePagination.currentPage}
                                        totalRecords={requestedToMePagination.totalItems}
                                        limit={limit}
                                        onPageChange={handlePageChange}
                                    />
                                )}
                            </TabsContent>
                        )}

                        {activeTab === 'my-requests' && (
                            <TabsContent value="my-requests" className="space-y-4">
                                <RequestedDocumentsTable
                                    documents={myRequestsDocuments}
                                    isLoading={isLoadingMyRequests}
                                    type="my-requests"
                                />

                                {/* Pagination */}
                                {myRequestsPagination && (
                                    <ApplicationsPagination
                                        currentPage={myRequestsPagination.currentPage}
                                        totalRecords={myRequestsPagination.totalItems}
                                        limit={limit}
                                        onPageChange={handlePageChange}
                                    />
                                )}
                            </TabsContent>
                        )}

                    </Tabs>
                </CardContent>
            </Card>
        </main>
    );
}
