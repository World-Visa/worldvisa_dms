"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientApplicationResponse, ClientDocument } from "@/types/client";
import { ClientDocumentsSummary } from "./ClientDocumentsSummary";
import { ApplicationDeadlineCard } from "./ApplicationDeadlineCard";
import { Calendar, User } from "lucide-react";
import { formatDate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  const getDeadlineStatus = (deadline: string | undefined) => {
    if (!deadline) return "unset" as const;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (deadlineDate < today) return "passed" as const;
    if (diffDays <= 30) return "approaching" as const;
    return "ok" as const;
  };

  const deadlineStatus = getDeadlineStatus(application.Deadline_For_Lodgment);

  return (
    <div className="space-y-6">
      {/* 70/30 row — match admin ApplicantDetails layout */}
      <div className="flex md:flex-row flex-col gap-6 items-stretch">
        {/* Left — Application Information (70%) */}
        <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="md:px-6 px-4 md:py-4 py-3 border-b border-gray-100 flex flex-wrap md:flex-nowrap md:items-center md:justify-between justify-start gap-4">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="w-8 h-8 hidden md:flex bg-primary/10 rounded-lg  items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Application Information
              </h3>
            </div>
            <Badge className="h-6 px-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-semibold hover:bg-emerald-50 w-fit whitespace-nowrap">
              {application?.Application_Stage}
            </Badge>
          </div>
          <div className="md:p-6 p-4">
            {/* Mobile (< md): clean accordion */}
            <div className="md:hidden">
              <div className="rounded-2xl border border-gray-100 bg-linear-to-b from-gray-50 to-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-semibold">
                      Applicant
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-slate-900 truncate">
                      {formatValue(application.Name)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      {formatValue(application.Email)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                      ID{" "}
                      <span className="font-bold tabular-nums">
                        {formatValue(application.id)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="personal" className="border-gray-100">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Personal
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                            {formatValue(application.Phone)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-[48%]">
                          {formatValue(application.Email)}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Full name
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right">
                              {formatValue(application.Name)}
                            </p>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Email
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right truncate max-w-[65%]">
                              {formatValue(application.Email)}
                            </p>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Phone
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right">
                              {formatValue(application.Phone)}
                            </p>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Application ID
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right tabular-nums">
                              {formatValue(application.id)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="visa" className="border-gray-100">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Visa
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                            {formatValue(application.Qualified_Country || "")}
                          </p>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 truncate max-w-[48%]">
                          {formatValue(
                            application.Service_Finalized || "",
                          ).toUpperCase()}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Target country
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right">
                              {formatValue(application.Qualified_Country || "")}
                            </p>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Service type
                            </p>
                            <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-bold text-slate-700">
                              {formatValue(
                                application.Service_Finalized || "",
                              ).toUpperCase()}
                            </span>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Suggested ANZSCO
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right">
                              {formatValue(application.Suggested_Anzsco || "")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="management" className="border-gray-100">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Management
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                            {formatValue(application.Application_Handled_By)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-[48%]">
                          {application.Created_Time
                            ? formatDate(application.Created_Time, "time")
                            : "Not available"}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Handled by
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right">
                              {formatValue(application.Application_Handled_By)}
                            </p>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Created
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right">
                              {application.Created_Time
                                ? formatDate(application.Created_Time, "time")
                                : "Not available"}
                            </p>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Assessing authority
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right">
                              {formatValue(
                                application.Assessing_Authority || "",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="assets" className="border-gray-100">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Assets
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                            {formatValue(application.Record_Type || "")}
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 tabular-nums">
                          {(application.AttachmentCount || 0).toString()} docs
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Record type
                            </p>
                            <p className="text-sm font-semibold text-slate-900 text-right">
                              {formatValue(application.Record_Type || "")}
                            </p>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-slate-400 font-semibold">
                              Total attachments
                            </p>
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 tabular-nums">
                              {application.AttachmentCount || 0} Documents
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Mobile deadline mini-card */}
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={[
                        "h-9 w-9 rounded-xl flex items-center justify-center border",
                        deadlineStatus === "passed"
                          ? "bg-red-50 border-red-100"
                          : deadlineStatus === "approaching"
                            ? "bg-amber-50 border-amber-100"
                            : "bg-gray-50 border-gray-100",
                      ].join(" ")}
                    >
                      <Calendar
                        className={[
                          "h-4 w-4",
                          deadlineStatus === "passed"
                            ? "text-red-500"
                            : deadlineStatus === "approaching"
                              ? "text-amber-500"
                              : "text-slate-500",
                        ].join(" ")}
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Lodgement deadline
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {application.Deadline_For_Lodgment
                          ? formatDate(application.Deadline_For_Lodgment)
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                  {deadlineStatus !== "ok" && deadlineStatus !== "unset" && (
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border",
                        deadlineStatus === "passed"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200",
                      ].join(" ")}
                    >
                      {deadlineStatus === "passed" ? "Overdue" : "Due soon"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop (md+): keep current grid */}
            <div className="hidden md:block">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
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
        </div>

        {/* Right — Application Deadline (30%) */}
        <div className="flex-3 min-w-0 hidden md:block">
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
