"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/primitives/button";
import { AlertTriangle } from "lucide-react";
import { RequestedDocument } from "@/lib/api/requestedDocuments";
import { useAddComment } from "@/hooks/useCommentMutations";
import { RequestDocStatusBadge } from "./RequestDocStatusBadge";
import {
  useUpdateDocumentStatus,
  useDeleteRequestedDocument,
} from "@/hooks/useRequestedDocumentActions";
import { useRequestedDocumentData } from "@/hooks/useRequestedDocumentData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { DocumentEmbedPreview } from "@/components/applications/document-preview/DocumentEmbedPreview";
import { getDocumentUrl, type DocUrlFields } from "@/lib/documents/getDocumentUrl";
import { RequestedDocumentMessages } from "./RequestedDocumentMessages";
import { RequestedApplicationDetailsPanel } from "./RequestedApplicationDetailsPanel";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApplicationDetails } from "@/hooks/useApplicationDetails";
import { useSpouseApplicationDetails } from "@/hooks/useSpouseApplicationDetails";
import { ApplicationDetailsResponse } from "@/types/applications";
import {
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiDeleteBin7Line,
  RiExternalLinkLine,
  RiFileUserLine,
} from "react-icons/ri";
import { PublishToClientDialog } from "./PublishToClientDialog";
import { useSendRequestedDocumentMessage } from "@/hooks/useRequestedDocumentMessages";
import { Textarea } from "../ui/textarea";
import { showErrorToast, showWarningToast } from "../ui/primitives/sonner-helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const REVIEW_COMMENT_SUGGESTIONS = [
  "Good to go",
  "Not Matching",
  "Needs correction",
  "Recheck",
] as const;

type SidePanelView = "messages" | "applicationDetails";

interface RequestedDocumentViewSheetProps {
  document: RequestedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  type: "requested-to-me" | "my-requests" | "all-requests";
}

export function RequestedDocumentViewSheet({
  document,
  isOpen,
  onClose,
  type,
}: RequestedDocumentViewSheetProps) {
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const canAccessMessages = Boolean(
    user?.role &&
      ["admin", "team_leader", "master_admin", "supervisor"].includes(user.role),
  );
  const updateStatusMutation = useUpdateDocumentStatus();
  const deleteDocumentMutation = useDeleteRequestedDocument();
  const sendRequestedMessageMutation = useSendRequestedDocumentMessage();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { document: currentDoc } = useRequestedDocumentData(
    document?._id || "",
  );

  const displayDoc = currentDoc || document;

  const regularApplicationQuery = useApplicationDetails(
    displayDoc?.record_id || "",
  );
  const spouseApplicationQuery = useSpouseApplicationDetails(
    displayDoc?.record_id || "",
  );

  const applicationResponse =
    regularApplicationQuery.data || spouseApplicationQuery.data;
  const isApplicationLoading =
    regularApplicationQuery.isLoading || spouseApplicationQuery.isLoading;
  const application = (applicationResponse as ApplicationDetailsResponse)?.data;

  useEffect(() => {
    if (document) {
      queryClient.setQueryData(["requested-document", document._id], document);
    }
  }, [document, queryClient]);

  const [reviewComment, setReviewComment] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanelView>("messages");
  const [publishState, setPublishState] = useState<{
    isOpen: boolean;
    text: string;
  }>({ isOpen: false, text: "" });

  const addCommentMutation = useAddComment(displayDoc?._id || "");

  useEffect(() => {
    if (!isOpen) {
      setReviewComment("");
      setIsReviewing(false);
      setSidePanel("messages");
    }
  }, [isOpen]);

  const handleMarkAsReviewed = useCallback(async () => {
    if (!displayDoc || !user?.username || !reviewComment.trim()) {
      showWarningToast("Please add a review comment");
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        documentId: displayDoc._id,
        data: {
          reviewId: displayDoc.requested_review._id,
          requested_by: displayDoc.requested_review.requested_by,
          requested_to: displayDoc.requested_review.requested_to,
          message: reviewComment.trim(),
          status: "reviewed",
        },
      });

      try {
        await sendRequestedMessageMutation.mutateAsync({
          documentId: displayDoc._id,
          reviewId: displayDoc.requested_review._id,
          data: { message: reviewComment.trim() },
        });
      } catch (messageError) {
        console.warn("Failed to send review comment as message:", messageError);
      }

      setReviewComment("");
      onClose();
    } catch (error) {
      console.error("Failed to mark as reviewed:", error);
      showErrorToast(`Failed to mark as reviewed: ${error}`);
    }
  }, [
    displayDoc,
    user?.username,
    reviewComment,
    updateStatusMutation,
    sendRequestedMessageMutation,
    onClose,
  ]);

  const handleDeleteRequest = useCallback(async () => {
    if (!displayDoc || !displayDoc.requested_review._id) {
      toast.error("Cannot delete: Review ID not found");
      return;
    }

    try {
      await deleteDocumentMutation.mutateAsync({
        documentId: displayDoc._id,
        data: {
          reviewId: displayDoc.requested_review._id,
          username: user?.username,
          role: user?.role,
        },
      });
      onClose();
    } catch { }
  }, [displayDoc, deleteDocumentMutation, onClose, user?.role, user?.username]);

  const handlePublishToClient = useCallback((messageText: string) => {
    setPublishState({ isOpen: true, text: messageText });
  }, []);

  const handleSendToClient = useCallback(async () => {
    if (!publishState.text.trim() || !user?.username || !displayDoc?._id) return;
    try {
      await addCommentMutation.mutateAsync({
        comment: publishState.text.trim(),
        added_by: user.username,
      });
      setPublishState({ isOpen: false, text: "" });
    } catch {
      // mutation handles error toast
    }
  }, [publishState.text, user?.username, displayDoc?._id, addCommentMutation]);

  const handleViewApplication = useCallback(() => {
    if (!displayDoc?.record_id) {
      toast.error("Application record ID not found");
      return;
    }

    const route =
      application?.Record_Type === "spouse_skill_assessment"
        ? `/v2/spouse-skill-assessment-applications/${displayDoc.record_id}`
        : `/v2/applications/${displayDoc.record_id}`;

    router.push(route);
    onClose();
  }, [displayDoc?.record_id, application?.Record_Type, router, onClose]);

  const openApplicationDetails = useCallback(() => {
    if (!displayDoc?.record_id) {
      toast.error("Application record ID not found");
      return;
    }
    setSidePanel("applicationDetails");
  }, [displayDoc?.record_id]);

  const backFromApplicationDetails = useCallback(() => {
    setSidePanel("messages");
  }, []);

  if (!displayDoc) return null;

  const isRequestedToMe = type === "requested-to-me";
  const isAssignedToMe =
    displayDoc.requested_review.requested_to === user?.username;
  const canReviewAnyAsRole =
    user?.role === "master_admin" || user?.role === "supervisor";
  const canReview =
    displayDoc.requested_review.status === "pending" &&
    displayDoc.requested_review.requested_by !== user?.username &&
    (isAssignedToMe || !!canReviewAnyAsRole);
  const canDelete = !isRequestedToMe;

  const previewFileName =
    displayDoc.file_name || displayDoc.document_name || "document";
  const urlFields = displayDoc as RequestedDocument & DocUrlFields;
  const docUrl = getDocumentUrl(urlFields);
  const embedLeadId =
    urlFields.storage_type === "r2" ? null : displayDoc.record_id;

  const showSideColumn =
    canAccessMessages ||
    (Boolean(displayDoc.record_id) && sidePanel === "applicationDetails");

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent
          hideCloseButton
          className="flex h-[90vh] w-full max-w-[1240px] flex-col gap-0 overflow-hidden p-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border/40 px-6 py-3">
              <DialogTitle className="sr-only">Document Review</DialogTitle>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {displayDoc.document_name || displayDoc.file_name || "Document request"}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-medium">Requested by:</span>
                      {displayDoc.requested_review.requested_by}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-medium">Requested on:</span>
                      {displayDoc.requested_review.requested_at
                        ? new Date(
                          displayDoc.requested_review.requested_at,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })
                        : "Unknown date"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-medium">Uploaded on:</span>
                      {displayDoc.uploaded_at
                        ? new Date(displayDoc.uploaded_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          },
                        )
                        : "Unknown date"}
                    </span>
                    {displayDoc.isOverdue && (
                      <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue ({displayDoc.daysSinceRequest} days)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {displayDoc?.record_id && (
                  <div className="flex items-center">
                    <Button
                      mode="gradient"
                      variant="primary"
                      size="2xs"
                      className="rounded-r-none border-r border-white/20 text-xs"
                      leadingIcon={RiFileUserLine}
                      onClick={openApplicationDetails}
                    >
                      Application details
                    </Button>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          mode="gradient"
                          variant="primary"
                          size="2xs"
                          className="rounded-l-none px-1.5 text-xs"
                          leadingIcon={RiArrowDownSLine}
                          aria-label="Application actions"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-50 rounded-xl" align="end">
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2"
                          onSelect={handleViewApplication}
                        >
                          <RiExternalLinkLine className="size-4 shrink-0" />
                          Go to application
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  mode="ghost"
                  className="shrink-0 cursor-pointer"
                  onClick={() => onClose()}
                  aria-label="Close"
                >
                  <Cross2Icon className="size-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
              <div className="order-1 flex min-h-0 flex-1 flex-col">
                <DocumentEmbedPreview
                  className="min-h-0 flex-1 max-lg:min-h-[36vh]"
                  fileName={previewFileName}
                  viewUrl={docUrl}
                  downloadUrl={docUrl || undefined}
                  leadId={embedLeadId}
                  zohoGradientViewButton={false}
                  showFooter={false}
                />

                {isReviewing && (
                  <motion.div
                    className="shrink-0 space-y-3 border-t border-border/40 bg-muted/10 px-6 py-3"
                    initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0.12 }
                        : { type: "spring", stiffness: 380, damping: 32 }
                    }
                  >
                    <Textarea
                      rows={3}
                      placeholder="Add your review comment..."
                      value={reviewComment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                      className="w-full min-h-[80px] resize-none rounded-md border border-border bg-background p-3 text-sm focus-visible:border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                          Quick suggestions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {REVIEW_COMMENT_SUGGESTIONS.map((suggestion, index) => {
                            const isActive = reviewComment.trim() === suggestion;
                            return (
                              <motion.button
                                key={suggestion}
                                type="button"
                                initial={
                                  reduceMotion ? false : { opacity: 0, y: 6 }
                                }
                                animate={{ opacity: 1, y: 0 }}
                                transition={
                                  reduceMotion
                                    ? { duration: 0.1 }
                                    : {
                                        type: "spring",
                                        stiffness: 420,
                                        damping: 34,
                                        delay: index * 0.05,
                                      }
                                }
                                whileHover={
                                  reduceMotion ? undefined : { scale: 1.02, y: -1 }
                                }
                                whileTap={
                                  reduceMotion ? undefined : { scale: 0.97 }
                                }
                                onClick={() => setReviewComment(suggestion)}
                                className={cn(
                                  "rounded-lg border px-2 py-1.5 text-left text-xs font-medium leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                  isActive
                                    ? "border-foreground/30 bg-foreground/[0.07] text-foreground"
                                    : "border-border/60 bg-background text-foreground hover:border-border hover:bg-muted/40",
                                )}
                              >
                                {suggestion}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Button
                          onClick={handleMarkAsReviewed}
                          disabled={!reviewComment.trim()}
                          isLoading={updateStatusMutation.isPending}
                          variant="secondary"
                          mode="filled"
                          size="xs"
                          leadingIcon={RiCheckLine}
                          className="shrink-0 text-xs"
                        >
                          Mark as Reviewed
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div
                  className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border/40 px-6 py-4"
                  role="contentinfo"
                >
                  <RequestDocStatusBadge status={displayDoc.requested_review.status} />
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {canReview && !isReviewing && (
                      <Button
                        onClick={() => setIsReviewing(true)}
                        variant="secondary"
                        mode="filled"
                        size="xs"
                        leadingIcon={RiCheckLine}
                        className="shrink-0 text-xs"
                      >
                        Mark as Reviewed
                      </Button>
                    )}

                    {canReview && isReviewing && (
                      <Button
                        onClick={() => setIsReviewing(false)}
                        variant="secondary"
                        mode="outline"
                        size="xs"
                        className="shrink-0 text-xs"
                      >
                        Cancel Review
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        variant="error"
                        mode="lighter"
                        size="xs"
                        leadingIcon={RiDeleteBin7Line}
                        onClick={handleDeleteRequest}
                        isLoading={deleteDocumentMutation.isPending}
                        className="shrink-0 text-xs"
                      >
                        Delete Request
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {showSideColumn && (
                <>
                  <div className="hidden h-full w-px shrink-0 bg-border/40 lg:block" />
                  <div className="relative order-2 flex h-[50vh] min-h-0 w-full flex-col overflow-hidden border-t bg-muted/20 lg:h-full lg:w-[380px] lg:shrink-0 lg:border-t-0 lg:border-l">
                    <AnimatePresence mode="wait">
                      {canAccessMessages && sidePanel === "messages" && (
                        <motion.div
                          key="messages"
                          className="absolute inset-0 flex flex-col"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -20, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        >
                          <RequestedDocumentMessages
                            documentId={displayDoc._id}
                            reviewId={displayDoc.requested_review._id}
                            onPublishToClient={handlePublishToClient}
                          />
                        </motion.div>
                      )}
                      {sidePanel === "applicationDetails" && displayDoc.record_id && (
                        <motion.div
                          key="application-details"
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
                              onClick={backFromApplicationDetails}
                              aria-label={canAccessMessages ? "Back to messages" : "Close application details"}
                            >
                              <RiArrowLeftLine className="size-4" />
                            </Button>
                            <span className="text-sm font-semibold tracking-tight text-foreground">
                              Application details
                            </span>
                          </div>
                          <RequestedApplicationDetailsPanel
                            application={application}
                            isLoading={isApplicationLoading}
                            requestedDocument={displayDoc}
                            className="min-h-0 flex-1"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PublishToClientDialog
        open={publishState.isOpen}
        text={publishState.text}
        isPending={addCommentMutation.isPending}
        onOpenChange={(open) => {
          if (!addCommentMutation.isPending) {
            setPublishState((s) => ({ ...s, isOpen: open }));
          }
        }}
        onClose={() => setPublishState({ isOpen: false, text: "" })}
        onTextChange={(next) => setPublishState((s) => ({ ...s, text: next }))}
        onSend={handleSendToClient}
      />
    </>
  );
}
