"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Globe,
  Target,
  FileText,
  Briefcase,
  Library,
} from "lucide-react";
import { Application } from "@/types/applications";

interface ApplicationDetailsAccordionProps {
  application: Application | undefined;
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function ApplicationDetailsAccordion({
  application,
  isLoading,
  isOpen,
  onToggle,
}: ApplicationDetailsAccordionProps) {
  const getServiceBadgeVariant = (service: string) => {
    switch (service?.toLowerCase()) {
      case "permanent residency":
        return "default";
      case "work visa":
        return "secondary";
      case "student visa":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? "application-details" : ""}
      onValueChange={() => onToggle()}
      className="mb-4 cursor-pointer"
    >
      <AccordionItem value="application-details" className="border rounded-lg">
        <AccordionTrigger className="px-4 ">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            Application Details
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ) : application ? (
            <div className="space-y-3">
              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Applicant Name
                  </label>
                  <p className="text-sm font-medium">
                    {application.Name || "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="text-sm">
                    {application.Email || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Visa Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Target Country
                  </label>
                  <p className="text-sm">
                    {application.Qualified_Country || "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Assessing Authority
                  </label>
                  <p className="text-xs">
                    {application.Assessing_Authority || ""}
                  </p>
                </div>
              </div>

              {/* Application Management */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Service Type
                  </label>
                  <Badge
                    variant={getServiceBadgeVariant(
                      application.Service_Finalized || "",
                    )}
                    className="text-xs"
                  >
                    {application.Service_Finalized || ""}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Suggested ANZSCO
                  </label>
                  <p className="text-sm">
                    {application.Suggested_Anzsco || ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Library className="h-3 w-3" />
                    Record Type
                  </label>
                  <p className="text-sm">{application.Record_Type || ""}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Application details not available
              </p>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
