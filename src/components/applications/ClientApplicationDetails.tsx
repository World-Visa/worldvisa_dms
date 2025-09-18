"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientApplicationResponse, ClientDocument } from "@/types/client";
import { ClientDocumentsSummary } from "./ClientDocumentsSummary";
import { User, Mail, Phone, Calendar, FileText } from "lucide-react";
import { formatDate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";

interface ClientApplicationDetailsProps {
  data?: ClientApplicationResponse;
  documents?: ClientDocument[];
  isDocumentsLoading?: boolean;
  documentsError?: Error | null;
  isLoading: boolean;
  error: Error | null;
}

function getStatusTailwindClasses(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "text-blue-500";
    case "reviewed":
      return "text-purple-500";
    case "lodged":
      return "text-green-500"; // Chose green for lodged
    case "visa_received":
      return "text-teal-500";
    case "visa_rejected":
      return "text-red-500";
    default:
      return "text-gray-500"; // Default color for unknown status
  }
}

export function ClientApplicationDetails({
  data,
  documents,
  isDocumentsLoading,
  documentsError,
  isLoading,
  error,
}: ClientApplicationDetailsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
        <ClientDocumentsSummary
          documents={documents}
          isLoading={isDocumentsLoading ?? false}
          error={documentsError ?? null}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-destructive">
                Failed to load application details
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message}
              </p>
            </div>
          </CardContent>
        </Card>
        <ClientDocumentsSummary
          documents={documents}
          isLoading={isDocumentsLoading ?? false}
          error={documentsError ?? null}
        />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No application data available
              </p>
            </div>
          </CardContent>
        </Card>
        <ClientDocumentsSummary
          documents={documents}
          isLoading={isDocumentsLoading ?? false}
          error={documentsError ?? null}
        />
      </div>
    );
  }

  const application = data.data;

  const formatValue = (value: string) => {
    if (!value || value === "N/A") return "Not provided";
    return value;
  };

  return (
    <div className="space-y-6">
      {/* All Application Information in Single Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-between gap-2 text-base w-full">
              <div className="flex items-center gap-[6px]">
                <User className="h-4 w-4" />
                Application Information
              </div>
              {data?.data.DMS_Application_Status && (
                <div>
                  <p>
                    Application Status:{" "}
                    <span
                      className={`capitalize italic ${getStatusTailwindClasses(
                        data?.data.DMS_Application_Status
                      )}`}
                    >
                      {data?.data.DMS_Application_Status}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Full Name
                </label>
                <p className="text-sm font-medium">
                  {formatValue(application.Name)}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </label>
                <p className="text-sm">{formatValue(application.Email)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </label>
                <p className="text-sm">{formatValue(application.Phone)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Application ID
                </label>
                <p className="text-xs font-mono">
                  {formatValue(application.id)}
                </p>
              </div>
            </div>
          </div>

          {/* Application Management */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Application Management
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Handled By
                </label>
                <p className="text-sm">
                  {formatValue(application.Application_Handled_By)}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created Date
                </label>
                <p className="text-sm">
                  {application.Created_Time
                    ? formatDate(application.Created_Time, "time")
                    : "Not available"}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Attachments
                </label>
                <Badge
                  variant="secondary"
                  className="bg-green-600 hover:bg-green-400 text-white text-xs"
                >
                  {application.AttachmentCount || 0} documents
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Summary */}
      <ClientDocumentsSummary
        documents={documents}
        isLoading={isDocumentsLoading ?? false}
        error={documentsError ?? null}
      />
    </div>
  );
}
