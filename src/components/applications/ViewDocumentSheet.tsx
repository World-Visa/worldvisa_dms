import React, { useState, useEffect } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/primitives/button";
import DocumentComments from "./DocumentComments";
import CommentErrorBoundary from "./CommentErrorBoundary";
import DocumentStatusButtons from "./DocumentStatusButtons";
import DocumentStatusDisplay from "./DocumentStatusDisplay";
import { ReuploadDocumentModal } from "./ReuploadDocumentModal";
import { SendDocumentModal } from "./SendDocumentModal";
import {
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Document } from "@/types/applications";
import { useDocumentData } from "@/hooks/useDocumentData";
import { useQueryClient } from "@tanstack/react-query";
import { DocumentTimelinePanel } from "./DocumentTimeline";
import { DocumentMovedFilesPanel } from "./DocumentMovedFiles";
import { DocumentEmbedPreview } from "@/components/applications/document-preview/DocumentEmbedPreview";
import { getDocumentUrl } from "@/lib/documents/getDocumentUrl";
import { RiArrowLeftLine, RiBookOpenLine, RiUploadLine } from "react-icons/ri";
import DocumentModalActions from "./DocumentModalActions";
import { AnimatePresence, motion } from "motion/react";
import {
  AnimatePresence as FMAnimatePresence,
  motion as fmMotion,
  useReducedMotion,
} from "framer-motion";
interface ViewDocumentSheetProps {
  document: Document;
  documents: Document[];
  applicationId: string;
  isOpen?: boolean;
  onClose?: () => void;
  isClientView?: boolean;
  hideTrigger?: boolean;
  documentType?: string;
  category?: string;
  visaServiceType?: string;
}

const ViewDocumentSheet: React.FC<ViewDocumentSheetProps> = ({
  document,
  documents,
  applicationId,
  isOpen,
  onClose,
  isClientView = false,
  hideTrigger = false,
  documentType,
  category,
  visaServiceType,
}) => {
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'comments' | 'timeline' | 'deletedFiles'>('comments');
  const sendWidgetReducedMotion = useReducedMotion();

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

  useEffect(() => {
    if (!selectedDocument) return;

    if (
      !currentDoc ||
      currentDoc.status !== selectedDocument.status ||
      currentDoc.storage_type !== selectedDocument.storage_type
    ) {
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

  useEffect(() => {
    if (!isSendModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setIsSendModalOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isSendModalOpen]);

  if (!displayDoc || documents.length === 0) {
    if (hideTrigger) return null;
    return (
      <Button
        variant="primary"
        mode="ghost"
        size="sm"
        className="h-auto min-h-0 cursor-pointer px-0 py-0 underline-offset-2 hover:underline"
        disabled
        leadingIcon={RiBookOpenLine}
      >
        View document
      </Button>
    );
  }

  const previewFileName =
    displayDoc.file_name || displayDoc.document_name || "document";
  const docUrl = getDocumentUrl(displayDoc);
  const viewUrl = docUrl;
  const downloadUrl = docUrl || undefined;
  const isR2Document = displayDoc.storage_type === "r2";

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSendModalOpen(false);
            onClose?.();
          }
        }}
      >
        {!hideTrigger && (
          <DialogTrigger asChild>
            <Button
              variant="primary"
              mode="ghost"
              size="sm"
              className="h-auto text-sm min-h-0 cursor-pointer px-0 py-0 underline-offset-2 hover:underline"
            >
              view
            </Button>
          </DialogTrigger>
        )}
        <DialogContent
          hideCloseButton
          className="flex h-[90vh] w-full max-w-[1240px] flex-col gap-0 overflow-hidden p-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 flex-col gap-2 border-b border-border/40 px-6 py-3">
              <DialogTitle className="sr-only">Document Review</DialogTitle>
              <div className="flex w-full min-w-0 flex-row items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayDoc.document_name || displayDoc.file_name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3">
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

                <div className="flex shrink-0 items-center gap-2">
                  {documents.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        mode="ghost"
                        size="2xs"
                        className="h-7 w-7 cursor-pointer p-0"
                        disabled={!canGoPrev}
                        onClick={goPrev}
                        aria-label="Previous document"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[3ch] text-center text-xs tabular-nums text-muted-foreground">
                        {selectedIndex + 1}/{documents.length}
                      </span>
                      <Button
                        variant="secondary"
                        mode="ghost"
                        size="2xs"
                        className="h-7 w-7 cursor-pointer p-0"
                        disabled={!canGoNext}
                        onClick={goNext}
                        aria-label="Next document"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <DocumentModalActions
                    onActivityLog={() => setActivePanel('timeline')}
                    onDeletedFiles={() => setActivePanel('deletedFiles')}
                    onSendForVerification={() => setIsSendModalOpen(true)}
                    isClientView={isClientView}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    mode="ghost"
                    className="cursor-pointer shrink-0"
                    onClick={() => onClose?.()}
                    aria-label="Close"
                  >
                    <Cross2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
              <FMAnimatePresence initial={false}>
                {isSendModalOpen && (
                  <fmMotion.div
                    key="send-verification-layer"
                    role="presentation"
                    className="absolute inset-0 z-20 flex justify-end max-lg:justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: sendWidgetReducedMotion ? 0 : 0.18,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Dismiss send verification"
                      className="absolute inset-0 cursor-default border-0 bg-foreground/7 p-0 transition-colors hover:bg-foreground/9"
                      onClick={() => setIsSendModalOpen(false)}
                    />
                    <fmMotion.div
                      key="send-verification-panel"
                      role="group"
                      aria-label="Send for verification"
                      className="pointer-events-auto relative z-10 mx-4 mt-3 w-full max-w-[min(375px,calc(100%-2rem))] shrink-0 origin-top-right max-lg:mx-auto lg:mr-6"
                      initial={{
                        opacity: 0,
                        y: sendWidgetReducedMotion ? 0 : -10,
                        scale: sendWidgetReducedMotion ? 1 : 0.96,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 380,
                          damping: 28,
                        },
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <SendDocumentModal
                        selectedDocument={displayDoc}
                        onSend={() => {}}
                        onOpenChange={setIsSendModalOpen}
                        className="max-w-none"
                      />
                    </fmMotion.div>
                  </fmMotion.div>
                )}
              </FMAnimatePresence>
              <div className="order-1 flex min-h-0 flex-1 flex-col">
                <DocumentEmbedPreview
                  className="min-h-0 flex-1 max-lg:min-h-[36vh]"
                  fileName={previewFileName}
                  viewUrl={viewUrl}
                  downloadUrl={downloadUrl}
                  leadId={displayDoc.storage_type === "r2" ? null : applicationId}
                  zohoGradientViewButton={false}
                  showFooter={false}
                />

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border/40 px-6 py-4">
                  <DocumentStatusDisplay
                    document={displayDoc}
                    isClientView={isClientView}
                  />
                  <div className="flex shrink-0 items-center gap-2">
                    {isR2Document && viewUrl ? (
                      <Button
                        size="xs"
                        variant="secondary"
                        mode="lighter"
                        leadingIcon={RiBookOpenLine}
                        className="shrink-0 cursor-pointer gap-2 text-sm"
                        onClick={() => {
                          const opened = window.open(
                            viewUrl,
                            "_blank",
                            "noopener,noreferrer",
                          );
                          if (opened) opened.opener = null;
                        }}
                      >
                        Full view
                      </Button>
                    ) : null}
                    {!isClientView && (
                      <DocumentStatusButtons
                        document={displayDoc}
                        applicationId={applicationId}
                      />
                    )}
                    {displayDoc.status === "rejected" && (
                      <Button
                        onClick={() => setIsReuploadModalOpen(true)}
                        size="xs"
                        variant="primary"
                        mode="lighter"
                        leadingIcon={RiUploadLine}
                        className="shrink-0 cursor-pointer gap-2 text-sm"
                      >
                        Reupload
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden h-full w-px shrink-0 bg-border/40 lg:block" />

              <div className="relative order-2 flex h-[50vh] min-h-0 w-full flex-col overflow-hidden border-t bg-muted/20 lg:h-full lg:w-[380px] lg:shrink-0 lg:border-t-0 lg:border-l">
                <AnimatePresence mode="wait">
                  {activePanel === 'comments' && (
                    <motion.div
                      key="comments"
                      className="absolute inset-0 flex flex-col"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                      <CommentErrorBoundary>
                        <DocumentComments
                          documentId={displayDoc._id}
                          isClientView={isClientView}
                        />
                      </CommentErrorBoundary>
                    </motion.div>
                  )}
                  {activePanel === 'timeline' && (
                    <motion.div
                      key="timeline"
                      className="absolute inset-0 flex flex-col"
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 40, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3">
                        <Button
                          variant="secondary"
                          mode="ghost"
                          size="2xs"
                          className="cursor-pointer p-1"
                          onClick={() => setActivePanel('comments')}
                          aria-label="Back to comments"
                        >
                          <RiArrowLeftLine className="size-4" />
                        </Button>
                        <span className="text-sm font-semibold tracking-tight text-foreground">Activity Log</span>
                      </div>
                      <DocumentTimelinePanel documentId={displayDoc._id} className="px-6 py-5" />
                    </motion.div>
                  )}
                  {activePanel === 'deletedFiles' && (
                    <motion.div
                      key="deletedFiles"
                      className="absolute inset-0 flex flex-col"
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 40, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3">
                        <Button
                          variant="secondary"
                          mode="ghost"
                          size="2xs"
                          className="cursor-pointer p-1"
                          onClick={() => setActivePanel('comments')}
                          aria-label="Back to comments"
                        >
                          <RiArrowLeftLine className="size-4" />
                        </Button>
                        <span className="text-sm font-semibold tracking-tight text-foreground">Deleted Files</span>
                      </div>
                      <DocumentMovedFilesPanel documentId={displayDoc._id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReuploadDocumentModal
        isOpen={isReuploadModalOpen}
        onClose={() => setIsReuploadModalOpen(false)}
        applicationId={applicationId}
        document={displayDoc}
        documentType={finalDocumentType}
        category={finalCategory}
        isClientView={isClientView}
        visaServiceType={visaServiceType}
      />
    </>
  );
};

export default ViewDocumentSheet;
