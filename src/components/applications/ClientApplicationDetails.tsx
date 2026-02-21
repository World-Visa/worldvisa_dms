"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientApplicationResponse, ClientDocument } from "@/types/client";
import { ClientDocumentsSummary } from "./ClientDocumentsSummary";
import { ApplicationDeadlineCard } from "./ApplicationDeadlineCard";
import { User } from "lucide-react";
import { formatDate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";

interface ClientApplicationDetailsProps {
  data?: ClientApplicationResponse;
  documents?: ClientDocument[];
  isDocumentsLoading?: boolean;
  documentsError?: Error | null;
  isLoading: boolean;
  error: Error | null;
  user?: { role?: string } | null;
}

export function ClientApplicationDetails({
  data,
  documents,
  isDocumentsLoading,
  documentsError,
  isLoading,
  error,
  user,
}: ClientApplicationDetailsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-6 items-stretch">
          <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-1">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-3 min-w-0">
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
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
        <div className="flex gap-6 items-stretch">
          <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-destructive text-sm">
              Failed to load applicant details
            </p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </div>
          <div className="flex-3 min-w-0">
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
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
        <div className="flex gap-6 items-stretch">
          <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No application data available
            </p>
          </div>
          <div className="flex-3 min-w-0">
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
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
      {/* 70/30 row — match admin ApplicantDetails layout */}
      <div className="flex gap-6 items-stretch">
        {/* Left — Application Information (70%) */}
        <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Application Information
              </h3>
            </div>
            <Badge className="h-6 px-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-semibold hover:bg-emerald-50">
              {application?.Application_Stage}
            </Badge>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Personal Information
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Name)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Email)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Phone
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Phone)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Application ID
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.id)}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Visa Details
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Target Country
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Qualified_Country || "")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Service Type
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
                    {formatValue(
                      application.Service_Finalized || "",
                    ).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Suggested ANZSCO
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Suggested_Anzsco || "")}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Application Mgmt
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Handled By
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Application_Handled_By)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Created Date
                  </p>
                  <p className="text-sm font-semibold">
                    {application.Created_Time
                      ? formatDate(application.Created_Time, "time")
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Assessing Authority
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Assessing_Authority || "")}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Assets & Files
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Record Type
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Record_Type || "")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Total Attachments
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {application.AttachmentCount || 0} Documents
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Right — Application Deadline (30%) */}
        <div className="flex-3 min-w-0">
          <ApplicationDeadlineCard
            deadline={application.Deadline_For_Lodgment}
            user={user ?? null}
            onEditDeadline={() => {}}
            applicationStage={application.Application_Stage}
            showEdit={false}
            alwaysShowWhenDeadline={true}
          />
        </div>
      </div>

      {/* Documents Summary */}
      <ClientDocumentsSummary
        documents={documents}
        isLoading={isDocumentsLoading ?? false}
        error={documentsError ?? null}
      />
    </div>
  );
}
