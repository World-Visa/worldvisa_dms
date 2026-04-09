"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientApplicationResponse, ClientDocument } from "@/types/client";
import { Calendar } from "lucide-react";
import { formatDate } from "@/utils/format";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DeadlineWidget from "./deadline/DeadlineWidget";
import { DeadlineWidgetSkeleton } from "./deadline/DeadlineWidgetSkeleton";

const FF: React.CSSProperties = { fontFeatureSettings: "'ss11', 'calt' 0" };

function ClientInfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ ...FF, fontSize: 11, color: "#a3a3a3", fontWeight: 500, marginBottom: 2, lineHeight: "16px" }}>
        {label}
      </p>
      <p
        style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px", letterSpacing: "-0.078px" }}
        className="truncate min-w-0 select-none"
      >
        {value}
      </p>
    </div>
  );
}

function ClientSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...FF,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#a3a3a3",
        paddingBottom: 8,
        borderBottom: "1px solid #efefef",
      }}
    >
      {children}
    </p>
  );
}

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
        <div className="flex gap-2 items-stretch w-full min-w-0">
          {/* Skeleton — gray container matching ApplicationInfoCard */}
          <div
            className="flex-7 min-w-0 flex flex-col"
            style={{
              background: "#f7f7f7",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              gap: 6,
              paddingTop: 12,
              paddingLeft: 4,
              paddingRight: 4,
              paddingBottom: 4,
            }}
          >
            {/* Header row skeleton */}
            <div className="flex items-center justify-between" style={{ paddingLeft: 10, paddingRight: 10 }}>
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            {/* White card skeleton */}
            <div
              style={{
                borderRadius: "16px 16px 20px 20px",
                background: "white",
                boxShadow: "0px 0px 0px 1px #f5f5f5",
                padding: 12,
              }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="h-2.5 w-24 mb-1" />
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-1">
                        <Skeleton className="h-2.5 w-16" />
                        <Skeleton className="h-4 w-full max-w-[180px]" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-[358px] hidden md:block">
            <DeadlineWidgetSkeleton />
          </div>
        </div>
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
  const leadId = application.leadId ?? application.id;

  return (
    <div className="space-y-6">
      {/* 70/30 row — match admin ApplicantDetails layout */}
      <div className="flex gap-2 items-stretch w-full min-w-0">
        {/* Left — Application Information (70%) */}
        <div
          className="flex-7 min-w-0 flex flex-col"
          style={{
            background: "#f7f7f7",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            boxShadow:
              "0px 4px 6px -1px rgba(0,0,0,0.07)," +
              "0px 2px 4px -1px rgba(0,0,0,0.04)",
            gap: 6,
            paddingTop: 12,
            paddingLeft: 4,
            paddingRight: 4,
            paddingBottom: 4,
          }}
        >
          {/* Header — matches QCActionCard header pattern */}
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3" style={{ paddingLeft: 10, paddingRight: 10 }}>
            <p
              style={{ fontSize: 13, fontWeight: 500, lineHeight: "20px", letterSpacing: "-0.078px", color: "#a3a3a3", fontFeatureSettings: "'ss11', 'calt' 0" }}
              className="select-none"
            >
              Application Information
            </p>
            {/* Application_Stage — soft emerald pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 10px",
                borderRadius: 999,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontFeatureSettings: "'ss11', 'calt' 0",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, lineHeight: "18px", color: "#16a34a", letterSpacing: "-0.066px", fontFeatureSettings: "'ss11', 'calt' 0" }}>
                {application?.Application_Stage}
              </span>
            </span>
          </div>

          {/* White card — identical to ApplicationInfoCard inner card */}
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "16px 16px 20px 20px",
              background: "white",
              boxShadow:
                "0px 4px 8px -2px rgba(51,51,51,0.06)," +
                "0px 2px 4px 0px rgba(51,51,51,0.04)," +
                "0px 1px 2px 0px rgba(51,51,51,0.04)," +
                "0px 0px 0px 1px #f5f5f5",
            }}
          >
          <div className="md:p-3 p-4">
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

            {/* Desktop (md+): QCActionCard-style gray container */}
            <div className="hidden md:block">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
                {/* Col 1 — Personal Information */}
                <div className="flex flex-col gap-3">
                  <ClientSectionLabel>Personal Information</ClientSectionLabel>
                  <ClientInfoField label="Full Name" value={formatValue(application.Name)} />
                  <ClientInfoField label="Email" value={formatValue(application.Email)} />
                  <ClientInfoField label="Phone" value={formatValue(application.Phone)} />
                  <ClientInfoField label="Application ID" value={formatValue(application.id)} />
                </div>
                {/* Col 2 — Visa Details */}
                <div className="flex flex-col gap-3">
                  <ClientSectionLabel>Visa Details</ClientSectionLabel>
                  <ClientInfoField label="Target Country" value={formatValue(application.Qualified_Country || "")} />
                  <div>
                    <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 500, marginBottom: 2 }}>
                      Service Type
                    </p>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px" }}>
                      {formatValue(application.Service_Finalized || "")}
                    </span>
                  </div>
                  <ClientInfoField label="Suggested ANZSCO" value={formatValue(application.Suggested_Anzsco || "")} />
                </div>
                {/* Col 3 — Application Mgmt */}
                <div className="flex flex-col gap-3">
                  <ClientSectionLabel>Application Mgmt</ClientSectionLabel>
                  <ClientInfoField label="Handled By" value={formatValue(application.Application_Handled_By)} />
                  <div>
                    <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 500, marginBottom: 2 }}>
                      Created Date
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px" }}>
                      {application.Created_Time
                        ? formatDate(application.Created_Time, "time")
                        : "Not available"}
                    </p>
                  </div>
                  <ClientInfoField label="Assessing Authority" value={formatValue(application.Assessing_Authority || "")} />
                </div>
                {/* Col 4 — Assets & Files */}
                <div className="flex flex-col gap-3">
                  <ClientSectionLabel>Assets & Files</ClientSectionLabel>
                  <ClientInfoField label="Record Type" value={formatValue(application.Record_Type || "")} />
                  <div>
                    <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 500, marginBottom: 2 }}>
                      Total Documents
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px" }}>
                      {application.AttachmentCount || 0} documents
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Inner shadow overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: "inherit", boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }}
          />
          </div>
        </div>

        {/* Right — Application Deadline (30%) */}
        <div className="w-[358px] hidden md:block">
          <DeadlineWidget
            isClientView
            leadId={leadId}
            currentDeadline={application.Deadline_For_Lodgment}
          />
        </div>
      </div>
    </div>
  );
}
