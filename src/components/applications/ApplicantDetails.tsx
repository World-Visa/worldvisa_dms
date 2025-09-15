import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Application, Document } from '@/types/applications';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentsSummary } from './DocumentsSummary';
import { User, Mail, Phone, Calendar, Globe, FileText, Target, Briefcase } from 'lucide-react';
import { formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/badge';

interface ApplicantDetailsProps {
    application: Application | undefined;
    isLoading: boolean;
    error: Error | null;
    documents: Document[] | undefined;
    isDocumentsLoading: boolean;
    documentsError: Error | null;
}

export function ApplicantDetails({ application, isLoading, error, documents, isDocumentsLoading, documentsError }: ApplicantDetailsProps) {

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

    const formatValue = (value: string) => {
        if (!value || value === 'N/A') return 'Not provided';
        return value;
    };

    const getServiceBadgeVariant = (service: string) => {
        switch (service?.toLowerCase()) {
            case 'permanent residency':
                return 'default';
            case 'work visa':
                return 'secondary';
            case 'student visa':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="space-y-6">
            {/* All Application Information in Single Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        Application Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Personal Information */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Full Name
                                </label>
                                <p className="text-sm font-medium">{formatValue(application.Name)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Email
                                </label>
                                <p className="text-sm">{formatValue(application.Email)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Phone
                                </label>
                                <p className="text-sm">{formatValue(application.Phone)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Application ID
                                </label>
                                <p className="text-xs font-mono">{formatValue(application.id)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Visa Information */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visa Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    Target Country
                                </label>
                                <p className="text-sm">{formatValue(application.Qualified_Country || '')}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    Service Type
                                </label>
                                <Badge variant={getServiceBadgeVariant(application.Service_Finalized || '')} className="text-xs">
                                    {formatValue(application.Service_Finalized || '')}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    Suggested ANZSCO
                                </label>
                                <p className="text-sm">{formatValue(application.Suggested_Anzsco || '')}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Assessment Service
                                </label>
                                <p className="text-xs">{formatValue(application.Send_Check_List || '')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Application Management */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Application Management</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Handled By
                                </label>
                                <p className="text-sm">{formatValue(application.Application_Handled_By)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Created Date
                                </label>
                                <p className="text-sm">
                                    {application.Created_Time ? formatDate(application.Created_Time, 'time') : 'Not available'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Attachments
                                </label>
                                <Badge variant="secondary" className="bg-green-600 hover:bg-green-400 text-white text-xs">
                                    {application.AttachmentCount || 0} documents
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Summary */}
            <DocumentsSummary 
                documents={documents} 
                isLoading={isDocumentsLoading} 
                error={documentsError} 
            />
        </div>
    );
}
