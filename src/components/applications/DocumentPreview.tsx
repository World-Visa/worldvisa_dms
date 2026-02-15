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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface DocumentPreviewProps {
  document: Document;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
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
    document.file_name?.length > 15
      ? document.file_name.slice(0, 15) + "…"
      : document.file_name;

  return (
    <div className="bg-white rounded-lg shadow-sm border h-[50%] lg:h-[30%] overflow-hidden relative">
      <Table>
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <div className="flex flex-col sm:block">
                <span className="text-sm sm:text-base font-medium text-gray-900 wrap-break-word">
                  {displayFileName}
                </span>
                {!hasDocumentUrl && (
                  <span className="text-xs sm:hidden text-gray-500 mt-1">
                    No document URL available
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell align-middle">
              {(() => {
                const statusConfig = getStatusConfig(document.status);
                return (
                  <Badge
                    variant={statusConfig.variant}
                    className={`flex items-center space-x-1 w-fit ${statusConfig.className}`}
                  >
                    {statusConfig.icon}
                    <span>{statusConfig.label}</span>
                  </Badge>
                );
              })()}
            </TableCell>
            <TableCell className="text-right">
              {hasDocumentUrl ? (
                <Button
                  onClick={handleViewDocument}
                  className="bg-[#222222] hover:bg-[#222222]/80 text-white cursor-pointer w-full sm:w-auto"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">View Document</span>
                  <span className="sm:hidden">View</span>
                </Button>
              ) : (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  N/A
                </span>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {!hasDocumentUrl && (
        <div className="flex items-center justify-center h-full text-gray-500 p-4 sm:hidden">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">No document URL available</p>
            <p className="text-xs mt-1">Document: {document.file_name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;
