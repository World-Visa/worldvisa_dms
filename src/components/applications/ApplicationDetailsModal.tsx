"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Application } from "@/types/applications";
import { formatDate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  FileText,
  Target,
  Briefcase,
} from "lucide-react";

interface ApplicationDetailsModalProps {
  application: Application | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicationDetailsModal({
  application,
  isOpen,
  onClose,
}: ApplicationDetailsModalProps) {
  if (!application) return null;

  const formatValue = (value: string) => {
    if (!value || value === "N/A") return "Not provided";
    return value;
  };

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Application Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Full Name
                  </label>
                  <p className="font-medium">{formatValue(application.Name)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="font-medium">
                    {formatValue(application.Email)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </label>
                  <p className="font-medium">
                    {formatValue(application.Phone)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Application ID
                  </label>
                  <p className="font-mono text-sm">
                    {formatValue(application.id)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visa Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-4 w-4" />
                Visa Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Target Country
                  </label>
                  <p className="font-medium">
                    {formatValue(application.Qualified_Country || "")}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Service Type
                  </label>
                  <Badge
                    variant={getServiceBadgeVariant(
                      application.Service_Finalized || "",
                    )}
                  >
                    {formatValue(application.Service_Finalized || "")}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Suggested ANZSCO
                  </label>
                  <p className="font-medium">
                    {formatValue(application.Suggested_Anzsco || "")}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Assessment Service
                  </label>
                  <p className="font-medium text-sm">
                    {formatValue(application.Send_Check_List || "")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Application Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Handled By
                  </label>
                  <p className="font-medium">
                    {formatValue(application.Application_Handled_By)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created Date
                  </label>
                  <p className="font-medium">
                    {application.Created_Time
                      ? formatDate(application.Created_Time, "time")
                      : "Not available"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Attachments
                  </label>
                  <Badge
                    variant="secondary"
                    className="bg-green-600 hover:bg-green-400 text-white"
                  >
                    {application.AttachmentCount || 0} documents
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
