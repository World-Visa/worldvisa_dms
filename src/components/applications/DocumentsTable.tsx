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
import { useDeleteDocument } from '@/hooks/useMutationsDocuments';
import { useApplicationDocumentsPaginated } from '@/hooks/useApplicationDocumentsPaginated';
import { UploadDocumentsModal } from './UploadDocumentsModal';
import { ApplicationsPagination } from './ApplicationsPagination';
import { Trash2, Upload, FileText, CheckCircle, Clock, Eye, XCircle, AlertCircle } from 'lucide-react';
import ViewDocumentSheet from './ViewDocumentSheet';

interface DocumentsTableProps {
    applicationId: string;
    currentPage?: number;
    limit?: number;
    onPageChange?: (page: number) => void;
}

export function DocumentsTable({ applicationId, currentPage = 1, limit = 10, onPageChange }: DocumentsTableProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);

    const deleteDocumentMutation = useDeleteDocument();
    
    // Fetch paginated documents
    const {
        data: documentsData,
        isLoading,
        error,
        refetch
    } = useApplicationDocumentsPaginated(applicationId, currentPage, limit);

    const documents = documentsData?.data;
    const pagination = documentsData?.pagination;


    const handleDeleteDocument = (documentId: string, fileName: string) => {
        setDocumentToDelete({ id: documentId, name: fileName });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;
        
        try {
            await deleteDocumentMutation.mutateAsync(documentToDelete.id);
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
            // Refetch documents after successful deletion
            refetch();
        } catch {
            // Error is handled in the mutation hook
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
                    <CardTitle>Documents</CardTitle>
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

    if (!documents || documents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No documents uploaded yet</p>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Document
                        </Button>
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
                        <CardTitle>Documents</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>S.No</TableHead>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Uploaded By</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents?.map((document, index) => (
                                <TableRow key={document._id}>
                                    <TableCell className="font-medium">{(pagination?.currentPage ? (pagination.currentPage - 1) * pagination.limit : 0) + index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate max-w-[200px]" title={document.file_name}>
                                                {document.file_name}
                                            </span>
                                        </div>
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
                                    <TableCell>{document.uploaded_by}</TableCell>
                                    <TableCell>{formatDate(document.uploaded_at, 'time')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-2 w-full">
                                            <ViewDocumentSheet document={document} documents={documents} applicationId={applicationId} />
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
                            onPageChange={onPageChange || (() => {})}
                        />
                    )}
                </CardContent>
                <UploadDocumentsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    applicationId={applicationId}
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
        </>
    );
}
