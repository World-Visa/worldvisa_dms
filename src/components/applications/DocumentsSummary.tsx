import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Document } from '@/types/applications';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, AlertCircle, FileUp } from 'lucide-react';

type DocumentStatus = Document['status'];

interface DocumentsSummaryProps {
    documents: Document[] | undefined;
    isLoading: boolean;
    error: Error | null;
    /** When set, stat cards are clickable and this is the active filter. */
    selectedStatus?: DocumentStatus | null;
    /** When provided, stat cards act as filters; click toggles filter (same click clears). */
    onStatusClick?: (status: DocumentStatus | null) => void;
}

export function DocumentsSummary({ documents, isLoading, error, selectedStatus = null, onStatusClick }: DocumentsSummaryProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-12" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Documents Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-destructive">Failed to load documents summary</p>
                        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!documents) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Documents Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No documents data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate counts by status
    const pendingCount = documents?.filter(doc => doc.status === 'pending').length;
    const approvedCount = documents?.filter(doc => doc.status === 'approved').length;
    const reviewCount = documents?.filter(doc => doc.status === 'reviewed').length;
    const requestReviewCount = documents?.filter(doc => doc.status == 'request_review').length
    const rejectedReviewCount = documents?.filter(doc => doc.status === 'rejected').length
    const totalCount = documents?.length;

    const summaryCards: Array<{
        title: string;
        status: DocumentStatus;
        count: number;
        icon: typeof Clock;
        variant: 'secondary' | 'default' | 'outline';
        color: string;
        bgColor: string;
    }> = [
        {
            title: 'Pending',
            status: 'pending',
            count: pendingCount,
            icon: Clock,
            variant: 'secondary',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            title: 'Approved',
            status: 'approved',
            count: approvedCount,
            icon: CheckCircle,
            variant: 'default',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Reviewed',
            status: 'reviewed',
            count: reviewCount,
            icon: AlertCircle,
            variant: 'outline',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Requested',
            status: 'request_review',
            count: requestReviewCount,
            icon: FileUp,
            variant: 'outline',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            title: 'Rejected',
            status: 'rejected',
            count: rejectedReviewCount,
            icon: AlertCircle,
            variant: 'outline',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ];

    const isInteractive = typeof onStatusClick === 'function';

    return (
        <section className="w-full">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 w-full">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    const isActive = selectedStatus === card.status;
                    const handleClick = () => {
                        if (isInteractive) {
                            onStatusClick(isActive ? null : card.status);
                        }
                    };
                    const cardContent = (
                        <CardContent className="p-2 w-full">
                            <CardHeader className="flex gap-2 items-center justify-center">
                                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${card.bgColor} mb-1`}>
                                    <Icon className={`h-4 w-4 ${card.color}`} />
                                </div>
                                <span className="text-xs text-gray-700">{card.title}</span>
                            </CardHeader>
                            <span className="text-lg flex justify-center items-center font-bold text-gray-900">{card.count}</span>
                        </CardContent>
                    );
                    return (
                        <Card
                            key={card.title}
                            className={`flex flex-col items-start bg-white border rounded-md px-2 py-3 text-center ${isInteractive ? 'cursor-pointer transition-shadow hover:shadow-md' : ''} ${isActive ? 'ring-2 ring-primary' : ''}`}
                            {...(isInteractive
                                ? {
                                      role: 'button',
                                      tabIndex: 0,
                                      'aria-pressed': isActive,
                                      'aria-label': `Filter by ${card.title}`,
                                      onClick: handleClick,
                                      onKeyDown: (e: React.KeyboardEvent) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              handleClick();
                                          }
                                      },
                                  }
                                : {})}
                        >
                            {cardContent}
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}
