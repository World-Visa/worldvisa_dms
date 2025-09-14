import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { formatDate } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDeleteDocument } from '@/hooks/useMutationsDocuments';
import { useApplicationDocumentsPaginated } from '@/hooks/useApplicationDocumentsPaginated';
import { UploadDocumentsModal } from './UploadDocumentsModal';
import { ApplicationsPagination } from './ApplicationsPagination';
import { Trash2, FileText, CheckCircle, Clock, Eye, XCircle, AlertCircle } from 'lucide-react';
import ViewDocumentSheet from './ViewDocumentSheet';
import { Document as ApplicationDocument } from '@/types/applications';
import { ClientDocumentsResponse } from '@/types/client';
import { useClientDeleteDocument } from '@/hooks/useClientDeleteDocument';

interface DocumentsTableProps {
    applicationId: string;
    currentPage?: number;
    limit?: number; // Limit of documents per page
    onPageChange?: (page: number) => void;
    // Client privilege props
    isClientView?: boolean;
    // Client-specific data (when isClientView is true)
    clientDocumentsData?: ClientDocumentsResponse;
    clientIsLoading?: boolean;
    clientError?: Error | null;
    onClientDeleteSuccess?: () => void;
}

export function DocumentsTable({ 
    applicationId, 
    currentPage = 1, 
    limit = 10, 
    onPageChange,
    isClientView = false,
    clientDocumentsData,
    clientIsLoading = false,
    clientError = null,
    onClientDeleteSuccess
}: DocumentsTableProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);
    const [viewSheetOpen, setViewSheetOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<ApplicationDocument | null>(null);

    const deleteDocumentMutation = useDeleteDocument();
    const clientDeleteDocumentMutation = useClientDeleteDocument();

    const {
        data: adminDocumentsData,
        isLoading: adminIsLoading,
        error: adminError,
        refetch
    } = useApplicationDocumentsPaginated(applicationId, currentPage, limit);

    // Use appropriate data based on view type
    const documentsData = isClientView ? clientDocumentsData : adminDocumentsData;
    const isLoading = isClientView ? clientIsLoading : adminIsLoading;
    const error = isClientView ? clientError : adminError;

    const documents = isClientView 
        ? ((documentsData as ClientDocumentsResponse)?.data?.documents || [])
        : (documentsData?.data || []);
    const pagination = documentsData?.pagination;

    const handleDeleteDocument = (documentId: string, fileName: string) => {
        setDocumentToDelete({ id: documentId, name: fileName });
        setDeleteDialogOpen(true);
    };

    const handleViewDocument = (document: ApplicationDocument) => {
        setSelectedDocument(document);
        setViewSheetOpen(true);
    };

    const handleCloseViewSheet = () => {
        setViewSheetOpen(false);
        setSelectedDocument(null);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;
        try {
            if (isClientView) {
                await clientDeleteDocumentMutation.mutateAsync({
                    documentId: documentToDelete.id
                });
                onClientDeleteSuccess?.();
            } else {
                await deleteDocumentMutation.mutateAsync(documentToDelete.id);
                refetch();
            }
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
        } catch {
        }
    };

    const cancelDelete = () => {
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
    };


    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'approved':
                return {
                    icon: <CheckCircle className="h-3 w-3" />,
                    label: 'Approved',
                    className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
                    iconClassName: 'text-green-600'
                };
            case 'rejected':
                return {
                    icon: <XCircle className="h-3 w-3" />,
                    label: 'Rejected',
                    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
                    iconClassName: 'text-red-600'
                };
            case 'reviewed':
                return {
                    icon: <Eye className="h-3 w-3" />,
                    label: 'Reviewed',
                    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                    iconClassName: 'text-blue-600'
                };
            case 'request_review':
                return {
                    icon: <AlertCircle className="h-3 w-3" />,
                    label: 'Review Requested',
                    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
                    iconClassName: 'text-yellow-600'
                };
            case 'pending':
            default:
                return {
                    icon: <Clock className="h-3 w-3" />,
                    label: 'Pending',
                    className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
                    iconClassName: 'text-gray-600'
                };
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Submitted Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-destructive">Failed to load documents</p>
                        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!documents || (documents as unknown[])?.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No documents uploaded yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className='w-full'>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Submitted Documents</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>S.No</TableHead>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Document Type</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(documents as ApplicationDocument[])?.map((document: ApplicationDocument, index: number) => (
                                <TableRow key={document._id}>
                                    <TableCell className="font-medium">{(pagination?.currentPage ? (pagination.currentPage - 1) * pagination.limit : 0) + index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate max-w-[150px]" title={document.file_name}>
                                                {document.file_name.length > 20
                                                    ? `${document.file_name.substring(0, 20)}...`
                                                    : document.file_name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className='font-lexend '>
                                        {document.document_type ? (
                                            <Badge variant="secondary" className="text-xs max-w-[120px] font-medium truncate" title={document.document_type.replace(/_/g, ' ').replace(/\//g, '/')}>
                                                {(() => {
                                                    const formattedType = document.document_type.replace(/_/g, ' ').replace(/\//g, '/');
                                                    return formattedType.length > 15
                                                        ? `${formattedType.substring(0, 15)}...`
                                                        : formattedType;
                                                })()}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                Not specified
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className='font-lexend'>
                                        {document.document_category ? (
                                            <Badge
                                                variant={document.document_category.includes('Company Documents') ? "default" : "outline"}
                                                className={`text-xs max-w-[140px] font-medium  truncate ${document.document_category.includes('Company Documents')
                                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                        : ''
                                                    }`}
                                                title={document.document_category}
                                            >
                                                {document.document_category.length > 18
                                                    ? `${document.document_category.substring(0, 18)}...`
                                                    : document.document_category}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                Not specified
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const statusConfig = getStatusConfig(document.status);
                                            return (
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${statusConfig.className}`}>
                                                    <span className={statusConfig.iconClassName}>
                                                        {statusConfig.icon}
                                                    </span>
                                                    <span className='font-lexend'>{statusConfig.label}</span>
                                                </div>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell>{formatDate(document.uploaded_at, 'time')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-2 w-full">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => handleViewDocument(document)}
                                                className='cursor-pointer'
                                            >
                                                view
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteDocument(document._id, document.file_name)}
                                                disabled={deleteDocumentMutation.isPending}
                                                className='cursor-pointer'
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pagination && (
                        <ApplicationsPagination
                            currentPage={pagination.currentPage}
                            totalRecords={pagination.totalRecords}
                            limit={pagination.limit}
                            onPageChange={onPageChange || (() => { })}
                        />
                    )}
                </CardContent>
                <UploadDocumentsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    applicationId={applicationId}
                    company={undefined}
                    isClientView={isClientView}
                />
            </Card>

            {/* Delete Confirmation Dialog */}
            <DeleteDocumentDialog
                isOpen={deleteDialogOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                documentName={documentToDelete?.name || ''}
                isDeleting={deleteDocumentMutation.isPending}
            />

            {/* View Document Sheet */}
            {selectedDocument && (
                <ViewDocumentSheet
                    document={selectedDocument}
                    documents={documents as ApplicationDocument[]}
                    applicationId={applicationId}
                    isOpen={viewSheetOpen}
                    onClose={handleCloseViewSheet}
                    isClientView={isClientView}
                />
            )}
        </>
    );
}
