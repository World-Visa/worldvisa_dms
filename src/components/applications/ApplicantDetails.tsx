import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUpdateApplicationFields } from "@/hooks/useApplicationDetails";
import { Application, Document } from "@/types/applications";
import { formatDate } from "@/utils/format";
import { useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Calendar,
  FileText,
  Globe,
  Mail,
  Phone,
  Target,
  User,
  Clock,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DocumentsSummary } from "./DocumentsSummary";
import { DeadlineUpdateModal } from "./DeadlineUpdateModal";

interface ApplicantDetailsProps {
  application: Application | undefined;
  isLoading: boolean;
  error: Error | null;
  allDocuments: Document[] | undefined;
  isAllDocumentsLoading: boolean;
  allDocumentsError: Error | null;
  user: { role?: string } | null;
}

export function ApplicantDetails({
  application,
  isLoading,
  error,
  allDocuments,
  isAllDocumentsLoading,
  allDocumentsError,
  user,
}: ApplicantDetailsProps) {
  const [applicationStatuses] = useState([
    {
      label: "Pending",
      value: "pending",
    },
    {
      label: "Reviewed",
      value: "reviewed",
    },
    {
      label: "Lodged",
      value: "lodged",
    },
    {
      label: "Visa Received",
      value: "visa_received",
    },
    {
      label: "Visa Rejected",
      value: "visa_rejected",
    },
  ]);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const updateApplicationFields = useUpdateApplicationFields();

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row justify-between w-full gap-6 lg:gap-8 lg:items-end">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Card className="w-full lg:max-w-xs lg:w-full">
          <CardHeader>
            <CardTitle>Applicant Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applicant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load applicant details</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!application) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-lexend">Applicant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground font-lexend">
              No application data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // Check if deadline is approaching (within 30 days)
  const isDeadlineApproaching = (deadline: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  // Check if deadline has passed
  const isDeadlinePassed = (deadline: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const fields = {
        DMS_Application_Status: newStatus,
      };
      setIsStatusUpdating(true);

      await updateApplicationFields.mutateAsync({
        leadId: application.id,
        fieldsToUpdate: fields,
      });

      await queryClient.invalidateQueries({
        queryKey: ["application", application.id],
      });
    } catch (error) {
      console.error("Error updating application status: ", error);
    } finally {
      setIsStatusUpdating(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Deadline Card - Prominent Display */}
      {application.Deadline_For_Lodgment ? (
        <Card className={`border-2 ${isDeadlinePassed(application.Deadline_For_Lodgment)
            ? "border-red-500 bg-red-50"
            : isDeadlineApproaching(application.Deadline_For_Lodgment)
              ? "border-orange-500 bg-orange-50"
              : "border-blue-500 bg-blue-50"
          }`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${isDeadlinePassed(application.Deadline_For_Lodgment)
                    ? "text-red-600"
                    : isDeadlineApproaching(application.Deadline_For_Lodgment)
                      ? "text-orange-600"
                      : "text-blue-600"
                  }`} />
                <span className={`${isDeadlinePassed(application.Deadline_For_Lodgment)
                    ? "text-red-800"
                    : isDeadlineApproaching(application.Deadline_For_Lodgment)
                      ? "text-orange-800"
                      : "text-blue-800"
                  }`}>
                  Application Deadline
                </span>
                {isDeadlinePassed(application.Deadline_For_Lodgment) && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                {isDeadlineApproaching(application.Deadline_For_Lodgment) && !isDeadlinePassed(application.Deadline_For_Lodgment) && (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                )}
              </div>
              {(user?.role === 'admin' || user?.role === 'team_leader' || user?.role === 'master_admin') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeadlineModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Deadline
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${isDeadlinePassed(application.Deadline_For_Lodgment)
                    ? "text-red-700"
                    : isDeadlineApproaching(application.Deadline_For_Lodgment)
                      ? "text-orange-700"
                      : "text-blue-700"
                  }`}>
                  {formatDate(application.Deadline_For_Lodgment)}
                </p>
                <p className={`text-sm mt-1 ${isDeadlinePassed(application.Deadline_For_Lodgment)
                    ? "text-red-600"
                    : isDeadlineApproaching(application.Deadline_For_Lodgment)
                      ? "text-orange-600"
                      : "text-blue-600"
                  }`}>
                  {isDeadlinePassed(application.Deadline_For_Lodgment)
                    ? "⚠️ Deadline has passed"
                    : isDeadlineApproaching(application.Deadline_For_Lodgment)
                      ? "⚠️ Deadline approaching"
                      : "Application lodgement deadline"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Days remaining:
                </p>
                <p className={`text-xl font-semibold ${isDeadlinePassed(application.Deadline_For_Lodgment)
                    ? "text-red-600"
                    : isDeadlineApproaching(application.Deadline_For_Lodgment)
                      ? "text-orange-600"
                      : "text-blue-600"
                  }`}>
                  {(() => {
                    const deadlineDate = new Date(application.Deadline_For_Lodgment);
                    const today = new Date();
                    const diffTime = deadlineDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays < 0 ? "Overdue" : diffDays;
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Show a card when no deadline is set, with option to set one
        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-gray-800">
                  Application Deadline
                </span>
              </div>
              {(user?.role === 'admin' || user?.role === 'team_leader' || user?.role === 'master_admin') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeadlineModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Set Deadline
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-700">
                  No deadline set
                </p>
                <p className="text-sm mt-1 text-gray-600">
                  Application lodgement deadline not configured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Application Information in Single Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <div className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Application Information
            </div>
            <div className="flex gap-[8px] items-center">
              <label
                htmlFor="applicationStatus"
                className="text-sm font-medium"
              >
                Application Status:
              </label>
              {isStatusUpdating ? (
                <div className="flex items-center justify-center w-[180px] border border-gray-300 rounded-lg bg-gray-100 animate-pulse">
                  <span className="text-sm italic">Updating status...</span>
                </div>
              ) : (
                <Select
                  value={application?.DMS_Application_Status || ""}
                  onValueChange={handleStatusChange}
                  defaultValue={application?.DMS_Application_Status || ""}
                >
                  <SelectTrigger className="w-[180px] border border-gray-300 rounded-lg">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {applicationStatuses.map((status) => (
                        <SelectItem
                          className="capitalize italic"
                          key={status.label}
                          value={status.value}
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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

          {/* Visa Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Visa Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Target Country
                </label>
                <p className="text-sm">
                  {formatValue(application.Qualified_Country || "")}
                </p>
              </div>
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
                  {formatValue(application.Service_Finalized || "")}
                </Badge>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Suggested ANZSCO
                </label>
                <p className="text-sm">
                  {formatValue(application.Suggested_Anzsco || "")}
                </p>
              </div>
              {/* <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Assessment Service
                                </label>
                                <p className="text-xs">{formatValue(application.Send_Check_List || '')}</p>
                            </div> */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Assessing Authority
                </label>
                <p className="text-xs">
                  {formatValue(application.Assessing_Authority || "")}
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
      <DocumentsSummary
        documents={allDocuments}
        isLoading={isAllDocumentsLoading}
        error={allDocumentsError}
      />

      {/* Deadline Update Modal */}
      <DeadlineUpdateModal
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        leadId={application.id}
        currentDeadline={application.Deadline_For_Lodgment}
        applicationName={application.Name}
      />
    </div>
  );
}
