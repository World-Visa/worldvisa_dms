import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DocumentComments from "./DocumentComments";
import CommentErrorBoundary from "./CommentErrorBoundary";
import DocumentPreview from "./DocumentPreview";
import DocumentStatusButtons from "./DocumentStatusButtons";
import DocumentStatusDisplay from "./DocumentStatusDisplay";
import { SendDocumentModal } from "./SendDocumentModal";
import {
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertCircle,
} from "lucide-react";
import { Document } from "@/types/applications";
import { useDocumentData } from "@/hooks/useDocumentData";
import { useQueryClient } from "@tanstack/react-query";
import { getChecklistDocumentMeta } from "@/lib/documents/metadata";

interface ViewDocumentSheetProps {
  document: Document;
  documents: Document[];
  applicationId: string;
  isOpen?: boolean;
  onClose?: () => void;
  isClientView?: boolean;
  onReuploadDocument?: (
    documentId: string,
    documentType: string,
    category: string,
  ) => void;
  documentType?: string;
  category?: string;
}

const ViewDocumentSheet: React.FC<ViewDocumentSheetProps> = ({
  document,
  documents,
  applicationId,
  isOpen,
  onClose,
  isClientView = false,
  onReuploadDocument,
  documentType,
  category,
}) => {
  const finalDocumentType =
    documentType || document.document_type || "Document";
  const finalCategory =
    category || document.document_category || "Other Documents";
  const currentDocumentIndex = documents.findIndex(
    (doc) => doc._id === document._id,
  );
  const [selectedIndex, setSelectedIndex] = useState(
    currentDocumentIndex >= 0 ? currentDocumentIndex : 0,
  );

  const selectedDocument = documents[selectedIndex] || documents[0];
  const { document: currentDoc } = useDocumentData(selectedDocument?._id);
  const displayDoc = currentDoc || selectedDocument;

  const queryClient = useQueryClient();
  const checklistMeta = useMemo(() => {
    const candidateCategory =
      displayDoc?.document_category || category || finalCategory;

    const candidateType =
      displayDoc?.document_name ||
      documentType ||
      finalDocumentType ||
      displayDoc?.document_type;

    if (!candidateCategory || !candidateType) {
      return undefined;
    }

    return getChecklistDocumentMeta(candidateCategory, candidateType);
  }, [
    displayDoc?.document_category,
    displayDoc?.document_name,
    displayDoc?.document_type,
    category,
    documentType,
    finalCategory,
    finalDocumentType,
  ]);

  useEffect(() => {
    if (!selectedDocument) return;

    if (!currentDoc || currentDoc.status !== selectedDocument.status) {
      queryClient.setQueryData(
        ["document", selectedDocument._id],
        selectedDocument,
      );
    }
  }, [selectedDocument, currentDoc, queryClient]);

  useEffect(() => {
    const newIndex = documents.findIndex((doc) => doc._id === document._id);
    if (newIndex >= 0) {
      setSelectedIndex(newIndex);
    } else if (documents.length > 0) {
      setSelectedIndex(0);
    } else {
      if (onClose) {
        onClose();
      }
    }
  }, [documents, document._id, onClose]);

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < documents.length - 1;
  const goPrev = () => {
    if (canGoPrev) setSelectedIndex((i) => i - 1);
  };
  const goNext = () => {
    if (canGoNext) setSelectedIndex((i) => i + 1);
  };

  useEffect(() => {
    if (!isOpen || documents.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedIndex((i) => (i > 0 ? i - 1 : i));
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((i) => (i < documents.length - 1 ? i + 1 : i));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, documents.length]);

  if (!displayDoc || documents.length === 0) {
    return (
      <Button variant="link" size="sm" className="cursor-pointer" disabled>
        view
      </Button>
    );
  }

  return (
    <div className="w-full">
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetTrigger asChild>
          <Button variant="link" size="sm" className="cursor-pointer">
            view
          </Button>
        </SheetTrigger>
        <SheetContent className="inset-3! sm:inset-5! lg:inset-7! h-auto! w-auto! max-w-[1140px]! translate-x-0! translate-y-0! mx-auto rounded-2xl border border-border/50 shadow-2xl p-0">
          <div className="flex flex-col h-full overflow-hidden rounded-2xl">
            {/* Header */}
            <SheetHeader className="px-6 py-3 border-b border-border/40 shrink-0">
              <SheetTitle className="sr-only">Document Review</SheetTitle>
              <div className="flex items-center justify-between gap-4 pr-8">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {displayDoc.document_name || displayDoc.file_name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {displayDoc.uploaded_by}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(displayDoc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {documents.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 cursor-pointer"
                        disabled={!canGoPrev}
                        onClick={goPrev}
                        aria-label="Previous document"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground tabular-nums min-w-[3ch] text-center">
                        {selectedIndex + 1}/{documents.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 cursor-pointer"
                        disabled={!canGoNext}
                        onClick={goNext}
                        aria-label="Next document"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {!isClientView && (
                    <SendDocumentModal
                      documents={documents}
                      selectedDocument={displayDoc}
                      onSend={() => {}}
                    />
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Two-panel body */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Left: Document Review */}
              <div className="flex-1 flex flex-col min-h-0 order-1">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {checklistMeta?.importantNote && (
                    <Alert className="bg-destructive/5 border-destructive/20 text-destructive rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Important
                        </p>
                        <p className="text-xs font-medium whitespace-pre-line">
                          {checklistMeta.importantNote}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <DocumentPreview document={displayDoc} />

                  <DocumentStatusDisplay
                    document={displayDoc}
                    isClientView={isClientView}
                  />

                  {displayDoc.status === "rejected" && onReuploadDocument && (
                    <div>
                      <Button
                        onClick={() =>
                          onReuploadDocument(
                            displayDoc._id,
                            finalDocumentType,
                            finalCategory,
                          )
                        }
                        variant="outline"
                        size="sm"
                        className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        Reupload Document
                      </Button>
                    </div>
                  )}
                </div>

                {/* Fixed bottom action bar */}
                {!isClientView && (
                  <div className="border-t border-border/40 px-6 py-3 shrink-0">
                    <DocumentStatusButtons
                      document={displayDoc}
                      applicationId={applicationId}
                    />
                  </div>
                )}
              </div>

              {/* Vertical divider */}
              <div className="hidden lg:block w-px bg-border/40 shrink-0" />

              {/* Right: Chat */}
              <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l order-2 bg-muted/20 h-[50vh] lg:h-full">
                <CommentErrorBoundary>
                  <DocumentComments
                    documentId={displayDoc._id}
                    isClientView={isClientView}
                  />
                </CommentErrorBoundary>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ViewDocumentSheet;
