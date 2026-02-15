"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { QualityCheckApplication } from "@/lib/api/qualityCheck";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface QualityCheckTableProps {
  applications: QualityCheckApplication[];
  isLoading?: boolean;
  isSearchMode?: boolean;
  searchResults?: QualityCheckApplication[];
  isSearchLoading?: boolean;
  currentPage?: number;
  limit?: number;
}

export function QualityCheckTable({
  applications,
  isLoading = false,
  isSearchMode = false,
  searchResults = [],
  isSearchLoading = false,
}: QualityCheckTableProps) {
  const router = useRouter();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleViewApplication = (applicationId: string) => {
    router.push(`/admin/applications/${applicationId}`);
  };

  const getStatusIcon = (status: string | null | undefined) => {
    if (!status) {
      return <Clock className="h-4 w-4 text-gray-500" />;
    }
    switch (status.toLowerCase()) {
      case "lodged":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) {
      return "text-gray-700 bg-gray-50 border-gray-200";
    }
    switch (status.toLowerCase()) {
      case "lodged":
        return "text-green-700 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "rejected":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Time";
    }
  };

  if (isLoading || isSearchLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const displayApplications = isSearchMode ? searchResults : applications;

  if (displayApplications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No applications found
        </h3>
        <p className="text-gray-500">
          {isSearchMode
            ? "No quality check applications match your search criteria."
            : "No quality check applications available at the moment."}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Applicant</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Handled By</TableHead>
            <TableHead>Quality Check From</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayApplications.map((application, index) => (
            <TableRow
              key={`${application.id}-${index}`}
              className={cn(
                "hover:bg-gray-50 transition-colors cursor-pointer",
                hoveredRow === application.id && "bg-blue-50",
              )}
              onMouseEnter={() => setHoveredRow(application.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => handleViewApplication(application.id)}
            >
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {application.Name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      ID: {application.id}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600 truncate max-w-[150px]">
                      {application.Email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {application.Phone}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
                    getStatusColor(application.DMS_Application_Status),
                  )}
                >
                  {getStatusIcon(application.DMS_Application_Status)}
                  {application.DMS_Application_Status || "N/A"}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">
                    {application.Application_Handled_By}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">
                    {application.Quality_Check_From}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm text-gray-900">
                      {formatDate(application.Created_Time)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(application.Created_Time)}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-right">
                <Button
                  variant="link"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewApplication(application.id);
                  }}
                  className="h-8 w-8 p-0 text-blue-500 cursor-pointer hover:text-blue-600"
                >
                  view
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
