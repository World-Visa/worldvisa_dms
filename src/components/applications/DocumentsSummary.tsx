import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Document } from '@/types/applications';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, AlertCircle, FileUp } from 'lucide-react';

interface DocumentsSummaryProps {
    documents: Document[] | undefined;
    isLoading: boolean;
    error: Error | null;
}

export function DocumentsSummary({ documents, isLoading, error }: DocumentsSummaryProps) {
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

    const summaryCards = [
        {
            title: 'Pending',
            count: pendingCount,
            icon: Clock,
            variant: 'secondary' as const,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            title: 'Approved',
            count: approvedCount,
            icon: CheckCircle,
            variant: 'default' as const,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Reviewed',
            count: reviewCount,
            icon: AlertCircle,
            variant: 'outline' as const,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: "Requested",
            count: requestReviewCount,
            icon: FileUp,
            variant: 'outline' as const,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            title: "Rejected",
            count: rejectedReviewCount,
            icon: AlertCircle,
            variant: 'outline' as const,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ];

    return (
        <div className="space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Documents Summary</h3>
                <Badge variant="outline" className="text-sm w-fit">
                    Total: {totalCount} documents
                </Badge>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="hover:shadow-md w-full transition-shadow">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex flex-col items-center text-center space-y-3 justify-center">
                                    <div className={`p-2  rounded-full ${card.bgColor} flex-shrink-0`}>
                                        <Icon className={`h-4 w-4 ${card.color}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{card.title}</p>
                                        <p className="text-lg sm:text-2xl font-bold">{card.count}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
