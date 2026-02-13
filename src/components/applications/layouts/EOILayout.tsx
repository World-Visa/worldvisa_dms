'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconFolderCode } from '@tabler/icons-react';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStage2Documents, useDeleteStage2Document } from '@/hooks/useStage2Documents';
import { EOIModal } from '@/components/applications/modals/EOIModal';
import { formatDate } from '@/utils/format';
import {
  getVisaSubclassByCode,
  getStateByCode,
  getAnzscoCodeByCode,
} from '@/lib/constants/australianData';
import type { EOILayoutProps, Stage2Document } from '@/types/stage2Documents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EOILayoutComponentProps extends EOILayoutProps {
  isClientView?: boolean;
}

export function EOILayout({ applicationId, isClientView = false }: EOILayoutComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Stage2Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Stage2Document | null>(null);

  const { data, isLoading, error } = useStage2Documents(applicationId, 'eoi');
  const deleteMutation = useDeleteStage2Document();

  const documents = data?.data || [];

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      const fileCompare = (a.document_name || a.file_name || '').localeCompare(
        b.document_name || b.file_name || ''
      );
      if (fileCompare !== 0) return fileCompare;
      return (a.state || '').localeCompare(b.state || '');
    });
  }, [documents]);

  const handleView = (document: Stage2Document) => {
    const url = document.document_link || document.download_url;
    if (!url) {
      toast.error('Document URL not available');
      return;
    }
    const width = 800;
    const height = 600;
    const top = (window.screen.height - height) / 2;
    const left = (window.screen.width - width) / 2;
    window.open(
      url,
      '_blank',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  const handleEditClick = (document: Stage2Document) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (document: Stage2Document) => {
    setDocumentToDelete(document);
  };

  const handleDeleteConfirm = async () => {
    if (documentToDelete) {
      try {
        await deleteMutation.mutateAsync({
          applicationId,
          documentId: documentToDelete._id,
        });
        setDocumentToDelete(null);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
  };

  const getSubclassDisplay = (code?: string) => {
    if (!code) return 'N/A';
    const subclass = getVisaSubclassByCode(code);
    return subclass ? subclass.label : code;
  };

  const getStateDisplay = (code?: string) => {
    if (!code) return 'N/A';
    const state = getStateByCode(code);
    return state ? `${state.code} - ${state.name}` : code;
  };

  const getAnzscoDisplay = (code?: string) => {
    if (!code) return 'N/A';
    const data = getAnzscoCodeByCode(code);
    if (data) return `${data.anzsco_code} - ${data.name} (${data.assessing_authority})`;
    return code;
  };

  const uniqueFileCount = useMemo(() => {
    const names = new Set(sortedDocuments.map((d) => d.file_name || d.document_name));
    return names.size;
  }, [sortedDocuments]);

  const uniqueStateCount = useMemo(() => {
    const states = new Set(sortedDocuments.map((d) => d.state).filter(Boolean));
    return states.size;
  }, [sortedDocuments]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>EOI Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load EOI documents. Please try again later.
              </AlertDescription>
            </Alert>
          ) : documents.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-200">
                  <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>No EOI Yet</EmptyTitle>
                <EmptyDescription>
                  No EOI documents have been uploaded for this application.
                </EmptyDescription>
              </EmptyHeader>
              {!isClientView && (
                <EmptyContent>
                  <div className="flex gap-2">
                    <Button className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
                      Create EOI
                    </Button>
                  </div>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div>
              {!isClientView && (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsModalOpen(true)}>Add EOI Document</Button>
                </div>
              )}
              {documents.length > 1 && (
                <p className="text-sm text-muted-foreground mb-3">
                  {documents.length} EOI document{documents.length !== 1 ? 's' : ''}
                  {uniqueFileCount > 1 || uniqueStateCount > 1
                    ? ` (${uniqueFileCount} file${uniqueFileCount !== 1 ? 's' : ''} across ${uniqueStateCount} state${uniqueStateCount !== 1 ? 's' : ''})`
                    : ''}
                </p>
              )}
              <div className="rounded-md border overflow-x-auto max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableHead>Document Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Subclass</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>ANZSCO</TableHead>
                      <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDocuments.map((document, index) => {
                      const prevDoc = index > 0 ? sortedDocuments[index - 1] : null;
                      const sameFileAsPrev =
                        prevDoc &&
                        (prevDoc.file_name || prevDoc.document_name) ===
                          (document.file_name || document.document_name);
                      return (
                        <TableRow
                          key={document._id}
                          className={sameFileAsPrev ? 'bg-muted/20' : undefined}
                        >
                          <TableCell className="font-medium">
                            {document.document_name || document.file_name}
                          </TableCell>
                          <TableCell>{formatDate(document.date, 'short')}</TableCell>
                          <TableCell>{getSubclassDisplay(document.subclass)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {document.state ? getStateDisplay(document.state) : 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{document.point ?? 'N/A'}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={getAnzscoDisplay(document.skill_assessing_body)}>
                            {getAnzscoDisplay(document.skill_assessing_body)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              {isClientView ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleView(document)}
                                  title="View document"
                                >
                                  View
                                </Button>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" title="Actions">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleView(document)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditClick(document)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteClick(document)}
                                      variant='destructive'
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isClientView && (
        <>
          <EOIModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            applicationId={applicationId}
            document={editingDocument || undefined}
            mode={editingDocument ? 'edit' : 'create'}
          />

          <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the document &quot;{documentToDelete?.document_name || documentToDelete?.file_name}&quot;.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
