import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientDocument } from '@/types/client';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ClientDocumentsSummaryProps {
    documents: ClientDocument[] | undefined;
    isLoading: boolean;
    error: Error | null;
}

export function ClientDocumentsSummary({ documents, isLoading, error }: ClientDocumentsSummaryProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col items-center text-center space-y-3 justify-center">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-6 w-8" />
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
            <div className="text-center py-8">
                <p className="text-destructive">Failed to load documents summary</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </div>
        );
    }

    if (!documents) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No documents data available</p>
            </div>
        );
    }

    // Calculate counts by status
    const pendingCount = documents?.filter(doc => doc.status === 'pending').length;
    const approvedCount = documents?.filter(doc => doc.status === 'approved').length;
    const rejectedCount = documents?.filter(doc => doc.status === 'rejected').length;
    const totalCount = documents?.length;

    const summaryCards = [
        {
            title: 'Pending',
            count: pendingCount,
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            title: 'Approved',
            count: approvedCount,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: "Rejected",
            count: rejectedCount,
            icon: AlertCircle,
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
                                    <div className={`p-2 rounded-full ${card.bgColor} flex-shrink-0`}>
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
