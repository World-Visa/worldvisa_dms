import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Application, Document } from '@/types/applications';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentsSummary } from './DocumentsSummary';
import { ApplicationDetailsModal } from './ApplicationDetailsModal';
import { Eye } from 'lucide-react';

interface ApplicantDetailsProps {
    application: Application | undefined;
    isLoading: boolean;
    error: Error | null;
    documents: Document[] | undefined;
    isDocumentsLoading: boolean;
    documentsError: Error | null;
}

export function ApplicantDetails({ application, isLoading, error, documents, isDocumentsLoading, documentsError }: ApplicantDetailsProps) {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className='flex flex-col lg:flex-row justify-between w-full gap-6 lg:gap-8 lg:items-end'>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-full">
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                    ))}
                </div>
                <Card className='w-full lg:max-w-xs lg:w-full'>
                    <CardHeader>
                        <CardTitle>Applicant Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Applicant Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-destructive">Failed to load applicant details</p>
                        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!application) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className='font-lexend'>Applicant Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-muted-foreground font-lexend">No application data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className='flex flex-col lg:flex-row justify-between w-full gap-6 lg:gap-8 lg:items-end'>
            <DocumentsSummary
                documents={documents}
                isLoading={isDocumentsLoading}
                error={documentsError}
            />
            <Card className='w-full lg:max-w-xs lg:w-full'>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className='font-lexend text'>Applicant Details</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDetailsModalOpen(true)}
                            className="flex items-center text-sm cursor-pointer gap-1"
                        >
                            <Eye className="h-3 w-3" />
                            View More
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-6">
                        <div className="min-w-0">
                            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                            <p className="text-sm font-semibold truncate">{application.Name}</p>
                        </div>
                        <div className="min-w-0">
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-sm truncate">{application.Email}</p>
                        </div>
                        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-sm">{application.Phone}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Application Details Modal */}
            <ApplicationDetailsModal
                application={application}
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
            />
        </div>
    );
}
