'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/format';
import { Trash2 } from 'lucide-react';
import type { SampleDocument } from '@/types/sampleDocuments';

interface SampleDocumentGroup {
  key: string;
  documentName: string;
  type?: string;
  documents: SampleDocument[];
}

interface SampleDocumentsModalProps {
  group: SampleDocumentGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDocument: (document: SampleDocument) => void;
  onDeleteDocument?: (document: SampleDocument) => void;
  isClientView?: boolean;
}

export function SampleDocumentsModal({
  group,
  isOpen,
  onClose,
  onViewDocument,
  onDeleteDocument,
  isClientView = false,
}: SampleDocumentsModalProps) {
  const documents = group?.documents ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{group?.documentName ?? 'Documents'}</DialogTitle>
          {group?.type && <DialogDescription>Type: {group.type}</DialogDescription>}
        </DialogHeader>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document._id}>
                  <TableCell className="font-medium">{document.document_name}</TableCell>
                  <TableCell>{document.type ?? '—'}</TableCell>
                  <TableCell>{formatDate(document.createdAt, 'short')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onViewDocument(document)}>
                        View
                      </Button>
                      {!isClientView && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => onDeleteDocument?.(document)}
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
      </DialogContent>
    </Dialog>
  );
}


