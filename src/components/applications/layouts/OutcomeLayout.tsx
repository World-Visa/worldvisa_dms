"use client";

import { useState } from "react";
import { IconFolderCode } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Trash2, Pencil, MoreHorizontal, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  useStage2Documents,
  useDeleteStage2Document,
} from "@/hooks/useStage2Documents";
import { OutcomeModal } from "@/components/applications/modals/OutcomeModal";
import { formatDate } from "@/utils/format";
import type {
  OutcomeLayoutProps,
  Stage2Document,
} from "@/types/stage2Documents";
import { getAnzscoCodeByCode } from "@/lib/constants/australianData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OutcomeLayoutComponentProps extends OutcomeLayoutProps {
  isClientView?: boolean;
}

export function OutcomeLayout({
  applicationId,
  isClientView = false,
}: OutcomeLayoutComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Stage2Document | null>(
    null,
  );
  const [documentToDelete, setDocumentToDelete] =
    useState<Stage2Document | null>(null);

  const { data, isLoading, error } = useStage2Documents(
    applicationId,
    "outcome",
  );
  const deleteMutation = useDeleteStage2Document();

  const documents = data?.data || [];

  const handleView = (document: Stage2Document) => {
    const url = document.document_link || document.download_url;
    if (!url) {
      toast.error("Document URL not available");
      return;
    }

    const width = 800;
    const height = 600;
    const top = (window.screen.height - height) / 2;
    const left = (window.screen.width - width) / 2;

    window.open(
      url,
      "_blank",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`,
    );
  };

  const handleEditClick = (document: Stage2Document) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (document: Stage2Document) => {
    setDocumentToDelete(document);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
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
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Outcome Documents</CardTitle>
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
                Failed to load outcome documents. Please try again later.
              </AlertDescription>
            </Alert>
          ) : documents.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-200">
                  <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>No Outcome Yet</EmptyTitle>
                <EmptyDescription>
                  No outcome documents have been uploaded for this application.
                </EmptyDescription>
              </EmptyHeader>
              {!isClientView && (
                <EmptyContent>
                  <div className="flex gap-2">
                    <Button
                      className="cursor-pointer"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Create Outcome
                    </Button>
                  </div>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div>
              {!isClientView && (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsModalOpen(true)}>
                    Add Outcome Document
                  </Button>
                </div>
              )}
              {documents.length > 1 && (
                <p className="text-sm text-muted-foreground mb-3">
                  {documents.length} outcome document
                  {documents.length !== 1 ? "s" : ""}
                </p>
              )}
              <div className="rounded-md border overflow-x-auto max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableHead>Document Name</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Outcome Date</TableHead>
                      <TableHead>Skill Assessing Body</TableHead>
                      <TableHead className="text-right w-[80px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={document._id}>
                        <TableCell className="font-medium">
                          {document.document_name || document.file_name}
                        </TableCell>
                        <TableCell>{document.uploaded_by}</TableCell>
                        <TableCell>
                          {formatDate(document.uploaded_at, "short")}
                        </TableCell>
                        <TableCell>{document.outcome || "N/A"}</TableCell>
                        <TableCell>
                          {document.outcome_date
                            ? formatDate(document.outcome_date, "short")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const anzscoCode = document.skill_assessing_body;
                            if (!anzscoCode) return "N/A";
                            const codeData = getAnzscoCodeByCode(anzscoCode);
                            if (codeData) {
                              return `${codeData.anzsco_code} - ${codeData.name} (${codeData.assessing_authority})`;
                            }
                            return anzscoCode;
                          })()}
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    title="Actions"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleView(document)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditClick(document)}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(document)}
                                    variant="destructive"
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isClientView && (
        <>
          <OutcomeModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            applicationId={applicationId}
            document={editingDocument || undefined}
            mode={editingDocument ? "edit" : "create"}
          />

          <AlertDialog
            open={!!documentToDelete}
            onOpenChange={() => setDocumentToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the document &quot;
                  {documentToDelete?.document_name ||
                    documentToDelete?.file_name}
                  &quot;. This action cannot be undone.
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
