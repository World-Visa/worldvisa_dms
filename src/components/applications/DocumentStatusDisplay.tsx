import React from "react";
import { Document } from "@/types/applications";
import { MessageSquare } from "lucide-react";
import DocumentTimeline from "./DocumentTimeline";
import DocumentMovedFiles from "./DocumentMovedFiles";

interface DocumentStatusDisplayProps {
  document: Document;
  isClientView: boolean;
}

const DocumentStatusDisplay: React.FC<DocumentStatusDisplayProps> = ({
  document,
  isClientView,
}) => {
  const lastStatusChange = document.history[document.history.length - 1];

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isClientView && <DocumentMovedFiles documentId={document._id} />}
        </div>

        {lastStatusChange && (
          <div className="text-left sm:text-right w-full sm:w-auto">
            <div className="text-xs text-muted-foreground">
              Last updated by{" "}
              <span className="font-medium">{lastStatusChange.changed_by}</span>
            </div>
            <div className="text-xs text-muted-foreground/70">
              {new Date(lastStatusChange.changed_at).toLocaleDateString()} at{" "}
              {new Date(lastStatusChange.changed_at).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentStatusDisplay;
