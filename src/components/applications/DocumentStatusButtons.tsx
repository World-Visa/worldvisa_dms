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
    rejectMessage?: string
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
      <div className="absolute bottom-4 right-2 sm:bottom-1 sm:right-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        {!isAdmin && (
          <Button
            variant="default"
            size="sm"
            onClick={handleApprove}
            disabled={disabled || isUpdating || currentStatus === "approved"}
            className={`${
              currentStatus === "approved"
                ? "bg-green-800 text-white cursor-default"
                : "bg-green-700 text-white hover:bg-green-600 cursor-pointer"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
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
          className={`${
            currentStatus === "rejected"
              ? "bg-red-800 text-white cursor-default"
              : "cursor-pointer"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {updatingStatus === "rejected"
            ? "Updating..."
            : currentStatus === "rejected"
            ? "Rejected"
            : "Reject"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReviewed}
          disabled={disabled || isUpdating || currentStatus === "reviewed"}
          className={`${
            currentStatus === "reviewed"
              ? "bg-blue-600 text-white border-blue-600 cursor-default"
              : "bg-white border-blue-500 text-blue-600 hover:bg-blue-50 cursor-pointer"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
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
