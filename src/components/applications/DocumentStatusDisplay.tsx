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

interface DocumentStatusDisplayProps {
  document: Document;
}

const DocumentStatusDisplay: React.FC<DocumentStatusDisplayProps> = ({
  document,
}) => {
  const getStatusConfig = (status: Document["status"]) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: "Approved",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-4 w-4" />,
          label: "Rejected",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 border-red-200",
        };
      case "reviewed":
        return {
          icon: <Eye className="h-4 w-4" />,
          label: "Reviewed",
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "request_review":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Review Requested",
          variant: "outline" as const,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "pending":
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          label: "Pending",
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const statusConfig = getStatusConfig(document.status);
  const lastStatusChange = document.history[document.history.length - 1];

  return (
    <div className="bg-white rounded-lg border p-3 sm:p-4 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-[12px]">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <Badge
              variant={statusConfig.variant}
              className={`flex items-center space-x-1 ${statusConfig.className}`}
            >
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </Badge>
          </div>

          {/* Show Timeline */}
          {/* <DocumentTimeline documentId={document._id} /> */}
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
            <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
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
