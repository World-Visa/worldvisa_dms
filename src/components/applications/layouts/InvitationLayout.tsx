"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconFolderCode } from "@tabler/icons-react";
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
import { InvitationModal } from "@/components/applications/modals/InvitationModal";
import { formatDate } from "@/utils/format";
import {
  getVisaSubclassByCode,
  getStateByCode,
} from "@/lib/constants/australianData";
import type {
  InvitationLayoutProps,
  Stage2Document,
} from "@/types/stage2Documents";
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

interface InvitationLayoutComponentProps extends InvitationLayoutProps {
  isClientView?: boolean;
}

export function InvitationLayout({
  applicationId,
  isClientView = false,
}: InvitationLayoutComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Stage2Document | null>(
    null,
  );
  const [documentToDelete, setDocumentToDelete] =
    useState<Stage2Document | null>(null);

  const { data, isLoading, error } = useStage2Documents(
    applicationId,
    "invitation",
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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
  };

  const getSubclassDisplay = (code?: string) => {
    if (!code) return "N/A";
    const subclass = getVisaSubclassByCode(code);
    return subclass ? subclass.label : code;
  };

  const getStateDisplay = (code?: string) => {
    if (!code) return "N/A";
    const state = getStateByCode(code);
    return state ? `${state.code} - ${state.name}` : code;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invitation Documents</CardTitle>
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
                Failed to load invitation documents. Please try again later.
              </AlertDescription>
            </Alert>
          ) : documents.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-200">
                  <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>No Invitation Yet</EmptyTitle>
                <EmptyDescription>
                  No invitation documents have been uploaded for this
                  application.
                </EmptyDescription>
              </EmptyHeader>
              {!isClientView && (
                <EmptyContent>
                  <div className="flex gap-2">
                    <Button
                      className="cursor-pointer"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Create Invitation
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
                    Add Invitation Document
                  </Button>
                </div>
              )}
              {documents.length > 1 && (
                <p className="text-sm text-muted-foreground mb-3">
                  {documents.length} invitation document
                  {documents.length !== 1 ? "s" : ""}
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
                      <TableHead>Deadline</TableHead>
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
                        <TableCell>
                          {formatDate(document.date, "short")}
                        </TableCell>
                        <TableCell>
                          {getSubclassDisplay(document.subclass)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {document.state
                              ? getStateDisplay(document.state)
                              : "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{document.point ?? "N/A"}</TableCell>
                        <TableCell>
                          {document.deadline
                            ? formatDate(document.deadline, "short")
                            : "N/A"}
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
          <InvitationModal
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
