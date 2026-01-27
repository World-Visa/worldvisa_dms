'use client';

import { useMemo, useState } from 'react';
import { IconFolderCode } from '@tabler/icons-react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/format';
import { useSampleDocuments, useDeleteSampleDocument } from '@/hooks/useSampleDocuments';
import type { SampleDocument } from '@/types/sampleDocuments';
import { SampleDocumentsModal } from './SampleDocumentsModal';
import { SampleDocumentsUploadModal } from './SampleDocumentsUploadModal';

interface SampleDocumentsTableProps {
  applicationId: string;
  isClientView?: boolean;
}

interface SampleDocumentGroup {
  key: string;
  documentName: string;
  type?: string;
  documents: SampleDocument[];
  latestUpdatedAt: string;
}

export function SampleDocumentsTable({ applicationId, isClientView = false }: SampleDocumentsTableProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<SampleDocumentGroup | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<SampleDocument | null>(null);

  const { data, isLoading, error } = useSampleDocuments(applicationId);
  const deleteMutation = useDeleteSampleDocument();

  const documents = data?.data ?? [];

  const groupedDocuments = useMemo<SampleDocumentGroup[]>(() => {
    const map = new Map<string, SampleDocumentGroup>();

    documents.forEach((document) => {
      const key = document.document_name || document._id;
      const existing = map.get(key);

      const updatedAt = document.updatedAt || document.createdAt;

      if (existing) {
        existing.documents.push(document);
        if (updatedAt > existing.latestUpdatedAt) {
          existing.latestUpdatedAt = updatedAt;
        }
      } else {
        map.set(key, {
          key,
          documentName: document.document_name || 'Untitled Document',
          type: document.type,
          documents: [document],
          latestUpdatedAt: updatedAt,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.documentName.localeCompare(b.documentName)));
  }, [documents]);

  const handleViewDocument = (document: SampleDocument) => {
    const url = document.document_link || document.download_url;

    if (!url) {
      toast.error('Document URL not available');
      return;
    }

    const width = 800;
    const height = 600;
    const top = (window.screen.height - height) / 2;
    const left = (window.screen.width - width) / 2;

    window.open(url, '_blank', `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
  };

  const handleGroupView = (group: SampleDocumentGroup) => {
    if (group.documents.length === 1) {
      handleViewDocument(group.documents[0]);
      return;
    }

    setActiveGroup(group);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        applicationId,
        documentId: documentToDelete._id,
      });
      setDocumentToDelete(null);
    } catch (deleteError) {
      console.error('Delete sample document error:', deleteError);
    }
  };

  return (
    <>
      <div className='space-y-8'>
        <div className="flex flex-row items-center justify-between">
          <p className="text-base font-bold">Sample Documents</p>
          {!isClientView && (
            <Button variant="default" size="sm" onClick={() => setIsUploadOpen(true)}>
              Upload Sample Document
            </Button>
          )}
        </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>Failed to load sample documents. Please try again later.</AlertDescription>
            </Alert>
          ) : groupedDocuments.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-200">
                  <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>No Sample Documents</EmptyTitle>
                <EmptyDescription>No sample documents have been uploaded for this application.</EmptyDescription>
              </EmptyHeader>
              {!isClientView && (
                <EmptyContent>
                  <Button className="cursor-pointer" onClick={() => setIsUploadOpen(true)}>
                    Upload Sample Document
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedDocuments.map((group) => (
                    <TableRow key={group.key}>
                      <TableCell className="font-medium">{group.documentName}</TableCell>
                      <TableCell>
                        {group.documents.length === 1 ? (
                          <span className="text-muted-foreground">1 document</span>
                        ) : (
                          <span className="text-muted-foreground">{group.documents.length} documents</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(group.latestUpdatedAt, 'short')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleGroupView(group)} title="View document(s)">
                            {group.documents.length === 1 ? "view" : "view all"}
                          </Button>
                          {!isClientView && group.documents.length === 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDocumentToDelete(group.documents[0])}
                              title="Delete document"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </div>

      <SampleDocumentsUploadModal applicationId={applicationId} isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      <SampleDocumentsModal
        group={activeGroup}
        onClose={() => setActiveGroup(null)}
        onViewDocument={handleViewDocument}
        isOpen={!!activeGroup}
        isClientView={isClientView}
        onDeleteDocument={(document: SampleDocument) => {
          setDocumentToDelete(document);
          setActiveGroup(null);
        }}
      />

      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sample Document</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document "{documentToDelete?.document_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


