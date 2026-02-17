"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  FileText,
  Users,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Document } from "@/types/applications";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useReviewRequest } from "@/hooks/useReviewRequest";
import { useMyRequestedDocuments } from "@/hooks/useRequestedDocuments";
import { sendRequestedDocumentMessage } from "@/lib/api/requestedDocumentMessages";
import { updateDocumentStatus } from "@/lib/api/requestedDocumentActions";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SendDocumentModalProps {
  documents: Document[];
  selectedDocument: Document;
  onSend?: (
    documentIds: string[],
    notes: string,
    sendToUsers: string[],
  ) => void;
  applicationId?: string;
}

export function SendDocumentModal({
  selectedDocument,
  onSend,
}: SendDocumentModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins,
    error: adminError,
  } = useAdminUsers();

  // Always fetch user's requested documents to detect existing reviews (any status)
  const { data: myRequestedDocs } = useMyRequestedDocuments({});

  // Find ALL existing reviews for this document (both pending and reviewed)
  const existingReviews = useMemo(() => {
    if (!myRequestedDocs?.data) return [];
    return myRequestedDocs.data.filter(
      (doc) => doc._id === selectedDocument._id,
    );
  }, [selectedDocument._id, myRequestedDocs?.data]);

  // Build a map of existing reviews keyed by requested_to username
  const existingReviewsByAdmin = useMemo(() => {
    const map = new Map<string, (typeof existingReviews)[number]>();
    for (const review of existingReviews) {
      map.set(review.requested_review.requested_to, review);
    }
    return map;
  }, [existingReviews]);

  // "Update mode" = there's a PENDING existing review (simplified note-only UI)
  const pendingReview = useMemo(
    () =>
      existingReviews.find(
        (doc) => doc.requested_review.status === "pending",
      ) ?? null,
    [existingReviews],
  );
  const isUpdateMode = !!pendingReview;

  const reviewRequestMutation = useReviewRequest({
    onSuccess: (documentIds, requestedTo) => {
      onSend?.(documentIds, notes, requestedTo);
    },
    onError: (error) => {
      console.error("Review request failed:", error);
    },
  });

  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);

  const adminOptions: MultiSelectOption[] = useMemo(() => {
    if (!adminUsers || !user?.role) return [];

    const getRolePermissions = (userRole: string) => {
      switch (userRole) {
        case "admin":
          return ["team_leader"];
        case "team_leader":
          return ["master_admin", "supervisor", "admin"];
        case "master_admin":
          return ["team_leader", "supervisor", "admin", "master_admin"];
        case "supervisor":
          return ["team_leader", "master_admin", "admin", "supervisor"];
        default:
          return [];
      }
    };

    const allowedRoles = getRolePermissions(user.role);

    return adminUsers
      .filter(
        (admin) =>
          allowedRoles.includes(admin.role) &&
          admin.username !== user.username,
      )
      .map((admin) => ({
        value: admin.username,
        label: admin.username,
        role: admin.role,
      }));
  }, [adminUsers, user?.role, user?.username]);

  const invalidateReviewCaches = () => {
    const keys = [
      ["requested-documents-to-me"],
      ["my-requested-documents"],
      ["all-requested-documents"],
      ["application-documents"],
      ["application-documents-paginated"],
      ["application-details"],
    ];
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const handleSend = async () => {
    if (!user?.username) {
      toast.error("You must be logged in to send review requests.");
      return;
    }

    if (isUpdateMode && pendingReview) {
      // Update mode: send message to existing pending review
      if (!notes.trim()) {
        toast.error("Please add a note to update the review request.");
        return;
      }

      if (notes.length > 500) {
        toast.error("Note is too long. Please keep it under 500 characters.");
        return;
      }

      setIsSendingUpdate(true);
      try {
        await sendRequestedDocumentMessage(
          pendingReview._id,
          pendingReview.requested_review._id,
          { message: notes.trim() },
        );

        invalidateReviewCaches();
        toast.success("Note added to existing review request.");
        setIsOpen(false);
        setNotes("");
        onSend?.([selectedDocument._id], notes, []);
      } catch (error) {
        console.error("Failed to send update message:", error);
        toast.error("Failed to add note. Please try again.");
      } finally {
        setIsSendingUpdate(false);
      }
      return;
    }

    // Normal send mode (with admin selection)
    if (selectedAdmins.length === 0) {
      toast.error(
        "Please select at least one admin to send the document to.",
      );
      return;
    }

    const uniqueAdmins = [...new Set(selectedAdmins)];
    const message =
      notes.trim() || "Please review this document for verification.";

    if (message.length > 500) {
      toast.error("Message is too long. Please keep it under 500 characters.");
      return;
    }

    // Split admins into those with existing reviews vs new
    const adminsToUpdate: Array<{
      admin: string;
      review: (typeof existingReviews)[number];
    }> = [];
    const adminsToCreate: string[] = [];

    for (const admin of uniqueAdmins) {
      const existingReview = existingReviewsByAdmin.get(admin);
      if (existingReview) {
        adminsToUpdate.push({ admin, review: existingReview });
      } else {
        adminsToCreate.push(admin);
      }
    }

    setIsSendingUpdate(true);
    try {
      // Update existing reviews: set status back to pending + send message
      const updatePromises = adminsToUpdate.map(async ({ review }) => {
        await updateDocumentStatus(selectedDocument._id, {
          reviewId: review.requested_review._id,
          requested_by: review.requested_review.requested_by,
          requested_to: review.requested_review.requested_to,
          message,
          status: "pending",
        });
        await sendRequestedDocumentMessage(
          review._id,
          review.requested_review._id,
          { message },
        );
      });

      await Promise.all(updatePromises);

      // Create new review requests for admins without existing reviews
      if (adminsToCreate.length > 0) {
        await reviewRequestMutation.mutateAsync({
          documentIds: [selectedDocument._id],
          requestedTo: adminsToCreate,
          message,
          requestedBy: user.username,
        });
      }

      if (adminsToUpdate.length > 0) {
        invalidateReviewCaches();
        const updatedNames = adminsToUpdate.map((a) => a.admin).join(", ");
        if (adminsToCreate.length > 0) {
          toast.success(
            `Review updated for ${updatedNames} and new request sent to ${adminsToCreate.join(", ")}.`,
          );
        } else {
          toast.success(
            `Review request re-sent to ${updatedNames} with status set back to pending.`,
          );
        }
      }

      setIsOpen(false);
      setNotes("");
      setSelectedAdmins([]);
      onSend?.(
        [selectedDocument._id],
        notes,
        uniqueAdmins,
      );
    } catch (error) {
      console.error("Failed to send review requests:", error);
      toast.error("Failed to send review requests. Please try again.");
    } finally {
      setIsSendingUpdate(false);
    }
  };

  const isSubmitting = reviewRequestMutation.isPending || isSendingUpdate;
  const isFormValid = isUpdateMode
    ? !!notes.trim() && !!user?.username && !isSubmitting
    : selectedAdmins.length > 0 && !!user?.username && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 cursor-pointer h-8 text-xs font-medium"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {isUpdateMode ? "Update Note" : "Send for verification"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl border border-border/50 p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-sm font-medium text-foreground">
            {isUpdateMode ? "Update Review Note" : "Send for Verification"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Document info card */}
          <div className="rounded-xl border border-border/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedDocument.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploaded by {selectedDocument.uploaded_by}
                </p>
              </div>
              {isUpdateMode && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs bg-yellow-50 text-yellow-700 border-yellow-200 gap-1"
                >
                  <MessageSquare className="h-3 w-3" />
                  In Review
                </Badge>
              )}
            </div>
          </div>

          {/* Update mode info */}
          {isUpdateMode && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                This document already has a pending review request. Add a note
                to update the reviewer.
              </span>
            </div>
          )}

          {/* Admin selection - only for new requests */}
          {!isUpdateMode && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <label className="text-xs font-medium text-foreground">
                  Send to
                </label>
              </div>

              {!user?.username ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-destructive/5 border border-destructive/15 rounded-xl">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-xs text-destructive">
                    You must be logged in to send review requests.
                  </span>
                </div>
              ) : adminError ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-destructive/5 border border-destructive/15 rounded-xl">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-xs text-destructive">
                    Failed to load admin users. Please refresh.
                  </span>
                </div>
              ) : adminOptions.length === 0 && !isLoadingAdmins ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-xl">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    No admin users available.
                  </span>
                </div>
              ) : (
                <MultiSelect
                  options={adminOptions}
                  value={selectedAdmins}
                  onChange={setSelectedAdmins}
                  placeholder="Select admins..."
                  loading={isLoadingAdmins}
                  disabled={isLoadingAdmins || isSubmitting}
                  maxSelections={10}
                  className="w-full"
                />
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              {isUpdateMode ? "Note *" : "Note (optional)"}
            </label>
            <Textarea
              placeholder={
                isUpdateMode
                  ? "Add a note for the reviewer..."
                  : "Add instructions for verification..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[80px] max-h-[120px] resize-none rounded-xl border-border/60 bg-muted/30 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/30"
              maxLength={500}
              rows={3}
            />
            {notes.length > 400 && (
              <p className="text-[11px] text-muted-foreground">
                {500 - notes.length} characters remaining
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!isFormValid}
              size="sm"
              className={cn(
                "h-8 text-xs gap-2 cursor-pointer",
                "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {isUpdateMode
                    ? "Add Note"
                    : `Send to ${selectedAdmins.length || 0} admin${selectedAdmins.length !== 1 ? "s" : ""}`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
