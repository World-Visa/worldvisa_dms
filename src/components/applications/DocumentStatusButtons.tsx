import React, { useState } from "react";
import { Button } from "../ui/button";
import { Document } from "@/types/applications";
import { useDocumentStatusUpdate } from "@/hooks/useDocumentStatusUpdate";
import { useDocumentData } from "@/hooks/useDocumentData";
import { useAuth } from "@/hooks/useAuth";
import { RejectDocumentDialog } from "./RejectDocumentDialog";

interface DocumentStatusButtonsProps {
  document: Document;
  applicationId: string;
  disabled?: boolean;
}

const DocumentStatusButtons: React.FC<DocumentStatusButtonsProps> = ({
  document,
  applicationId,
  disabled = false,
}) => {
  const { user } = useAuth();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Get real-time document data from cache
  const { document: currentDocument } = useDocumentData(document._id);

  // Use the current document from cache, fallback to prop
  const displayDocument = currentDocument || document;

  const statusUpdateMutation = useDocumentStatusUpdate({
    applicationId,
    documentId: document._id, // Pass documentId for comment creation
    onSuccess: () => {
      setUpdatingStatus(null); // Clear loading state
    },
    onError: (error) => {
      console.error("Status update failed:", error);
      setUpdatingStatus(null); // Clear loading state on error
    },
  });

  const handleStatusUpdate = (
    status: "approved" | "rejected" | "reviewed",
    rejectMessage?: string,
  ) => {
    if (!user?.username) {
      console.error("User not authenticated");
      return;
    }

    setUpdatingStatus(status); // Set which button is loading
    statusUpdateMutation.mutate({
      documentId: document._id,
      status,
      changedBy: user.username,
      rejectMessage,
    });
  };

  const handleApprove = () => handleStatusUpdate("approved");
  const handleReject = () => setIsRejectDialogOpen(true);
  const handleReviewed = () => handleStatusUpdate("reviewed");

  const handleRejectConfirm = (reason: string) => {
    handleStatusUpdate("rejected", reason);
    setIsRejectDialogOpen(false);
  };

  const isUpdating = statusUpdateMutation.isPending;
  const currentStatus = displayDocument.status;
  const isAdmin = user?.role === "admin";

  return (
    <>
      <div className="flex items-center gap-2">
        {!isAdmin && (
          <Button
            variant="default"
            size="sm"
            onClick={handleApprove}
            disabled={disabled || isUpdating || currentStatus === "approved"}
            className={`h-8 text-xs font-medium cursor-pointer ${
              currentStatus === "approved"
                ? "bg-green-700 text-white"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {updatingStatus === "approved"
              ? "Updating..."
              : currentStatus === "approved"
                ? "Approved"
                : "Approve"}
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleReject}
          disabled={disabled || isUpdating || currentStatus === "rejected"}
          className={`h-8 text-xs font-medium cursor-pointer ${
            currentStatus === "rejected"
              ? "bg-red-700 text-white"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {updatingStatus === "rejected"
            ? "Updating..."
            : currentStatus === "rejected"
              ? "Rejected"
              : "Reject"}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleReviewed}
          disabled={disabled || isUpdating || currentStatus === "reviewed"}
          className={`h-8 text-xs font-medium cursor-pointer ${
            currentStatus === "reviewed"
              ? "bg-blue-700 text-white border-blue-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {updatingStatus === "reviewed"
            ? "Updating..."
            : currentStatus === "reviewed"
              ? "Reviewed"
              : "Review"}
        </Button>
      </div>

      <RejectDocumentDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        documentName={displayDocument.file_name}
        isLoading={updatingStatus === "rejected"}
      />
    </>
  );
};

export default DocumentStatusButtons;
