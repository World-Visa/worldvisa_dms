import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Document } from "@/types/applications";

interface DocumentPreviewProps {
  document: Document;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  const getStatusConfig = (status: Document["status"]) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: "Approved",
          className: "bg-green-50 text-green-700 border-green-200",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: "Rejected",
          className: "bg-red-50 text-red-700 border-red-200",
        };
      case "reviewed":
        return {
          icon: <Eye className="h-3.5 w-3.5" />,
          label: "Reviewed",
          className: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "request_review":
        return {
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          label: "Review Requested",
          className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        };
      case "pending":
      default:
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          label: "Pending",
          className: "bg-muted text-muted-foreground border-border/40",
        };
    }
  };

  const handleViewDocument = () => {
    const url = document.document_link || document.download_url;
    if (!url) return;

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

  const hasDocumentUrl = document.document_link || document.download_url;
  const displayFileName =
    document.file_name?.length > 30
      ? `${document.file_name.slice(0, 30)}…`
      : document.file_name;

  const statusConfig = getStatusConfig(document.status);

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {displayFileName}
            </p>
            <Badge
              variant="outline"
              className={`mt-1 text-xs h-5 gap-1 ${statusConfig.className}`}
            >
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </Badge>
          </div>
        </div>
        {hasDocumentUrl ? (
          <Button
            onClick={handleViewDocument}
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 cursor-pointer ml-3"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">View</span>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0 ml-3">
            No preview
          </span>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;
