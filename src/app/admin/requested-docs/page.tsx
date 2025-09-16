'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Eye } from 'lucide-react';
import { useRequestedDocumentsToMePaginated, useMyRequestedDocumentsPaginated } from '@/hooks/useRequestedDocuments';
import { RequestedDocumentsTable } from '@/components/requested-documents/RequestedDocumentsTable';
import { RequestedDocumentsFilters, RequestedDocumentsFilters as FiltersType } from '@/components/requested-documents/RequestedDocumentsFilters';
import { RequestedDocsStats } from '@/components/requested-documents/RequestedDocsStats';
import { ApplicationsPagination } from '@/components/applications/ApplicationsPagination';

export default function RequestedDocsPage() {
    const [activeTab, setActiveTab] = useState<'requested-to-me' | 'my-requests'>('requested-to-me');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10); // Fixed limit like ApplicationsTable
    const [filters, setFilters] = useState<FiltersType>({
        search: '',
        status: '',
        priority: '',
        requestedBy: '',
        requestedTo: ''
    });

    // Fetch data for both tabs with pagination
    const { 
        data: requestedToMeData, 
        isLoading: isLoadingRequestedToMe, 
        refetch: refetchRequestedToMe
    } = useRequestedDocumentsToMePaginated(currentPage, limit, filters);

    const { 
        data: myRequestsData, 
        isLoading: isLoadingMyRequests, 
        refetch: refetchMyRequests
    } = useMyRequestedDocumentsPaginated(currentPage, limit, filters);

    // Get documents and pagination data (server-side filtering)
    const requestedToMeDocuments = useMemo(() => requestedToMeData?.data || [], [requestedToMeData?.data]);
    const myRequestsDocuments = useMemo(() => myRequestsData?.data || [], [myRequestsData?.data]);
    const requestedToMePagination = requestedToMeData?.pagination;
    const myRequestsPagination = myRequestsData?.pagination;

    // Calculate stats from current page data
    const stats = useMemo(() => {
        return {
            pendingRequests: requestedToMeDocuments.filter(doc => doc.requested_review.status === 'pending').length,
            reviewedRequests: requestedToMeDocuments.filter(doc => doc.requested_review.status === 'approved').length,
            overdue: requestedToMeDocuments.filter(doc => doc.isOverdue).length,
            myPendingRequests: myRequestsDocuments.filter(doc => doc.requested_review.status === 'pending').length,
            myReviewedRequests: myRequestsDocuments.filter(doc => doc.requested_review.status === 'approved').length
        };
    }, [requestedToMeDocuments, myRequestsDocuments]);


    const handleRefresh = () => {
        if (activeTab === 'requested-to-me') {
            refetchRequestedToMe();
        } else {
            refetchMyRequests();
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleFiltersChange = (newFilters: FiltersType) => {
        setFilters(newFilters);
        setCurrentPage(1); 
    };


    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Requested Documents
                </h2>
                <p className="text-gray-600">
                    Manage and track document review requests.
                </p>
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
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                        <TabsList className="grid w-full grid-cols-2 h-12 mb-6">
                            <TabsTrigger value="requested-to-me" className="flex h-10 items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Requested to Me ({requestedToMePagination?.totalItems || 0})
                            </TabsTrigger>
                            <TabsTrigger value="my-requests" className="flex h-10 items-center gap-2">
                                <FileText className="h-4 w-4" />
                                My Requests ({myRequestsPagination?.totalItems || 0})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="requested-to-me" className="space-y-4">
                            <RequestedDocumentsFilters
                                filters={filters}
                                onFiltersChange={handleFiltersChange}
                                onRefresh={handleRefresh}
                                isRefreshing={isLoadingRequestedToMe}
                                totalCount={requestedToMePagination?.totalItems || 0}
                                filteredCount={requestedToMeDocuments.length}
                            />
                            
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

                        <TabsContent value="my-requests" className="space-y-4">
                            <RequestedDocumentsFilters
                                filters={filters}
                                onFiltersChange={handleFiltersChange}
                                onRefresh={handleRefresh}
                                isRefreshing={isLoadingMyRequests}
                                totalCount={myRequestsPagination?.totalItems || 0}
                                filteredCount={myRequestsDocuments.length}
                            />
                            
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
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    );
}
