'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Globe, Target, FileText, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { Application } from '@/types/applications';
import { Button } from '@/components/ui/button';

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
  onToggle
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

  console.log("applicationss>>>>>>>>>>>>", application)
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
        >
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Application Details
          </CardTitle>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3 pt-0">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ) : application ? (
            <>
              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Applicant Name
                  </label>
                  <p className="text-sm font-medium">{application.Name || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="text-sm">{application.Email || 'Not provided'}</p>
                </div>
              </div>

              {/* Visa Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Target Country
                  </label>
                  <p className="text-sm">{application.Qualified_Country || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Assessing Authority
                  </label>
                  <p className="text-xs">
                    {(application.Assessing_Authority || "")}
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
                      application.Service_Finalized || ""
                    )}
                    className="text-xs"
                  >
                    {(application.Service_Finalized || "")}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Suggested ANZSCO
                  </label>
                  <p className="text-sm">
                    {(application.Suggested_Anzsco || "")}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Application details not available</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
