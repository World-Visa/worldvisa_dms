import React from "react";
import { Document } from "@/types/applications";
import { Badge } from "../ui/badge";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
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
    <div className="p-3 sm:p-2 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-[12px]">
          {/* Show Timeline */}
          {!isClientView && <DocumentTimeline documentId={document._id} />}

          {!isClientView && <DocumentMovedFiles documentId={document._id} />}
        </div>

        {lastStatusChange && (
          <div className="text-left sm:text-right w-full sm:w-auto">
            <div className="text-xs text-gray-500">
              Last updated by{" "}
              <span className="font-medium">{lastStatusChange.changed_by}</span>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(lastStatusChange.changed_at).toLocaleDateString()} at{" "}
              {new Date(lastStatusChange.changed_at).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Show reject message if document is rejected */}
      {document.status === "rejected" && document.reject_message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-800 mb-1">
                Reason for rejection:
              </div>
              <div className="text-sm text-red-700">
                {document.reject_message}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentStatusDisplay;
