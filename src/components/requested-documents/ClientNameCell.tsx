"use client";

import React from "react";
import { User, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationDetails } from "@/hooks/useApplicationDetails";
import { useSpouseApplicationDetails } from "@/hooks/useSpouseApplicationDetails";
import { ApplicationDetailsResponse } from "@/types/applications";

interface ClientNameCellProps {
  recordId: string;
  clientName?: string;
}

export function ClientNameCell({ recordId, clientName }: ClientNameCellProps) {
  if (clientName != null && clientName.trim() !== "") {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-medium text-gray-900 truncate max-w-[180px]"
          title={clientName}
        >
          {clientName}
        </span>
      </div>
    );
  }

  const regularQuery = useApplicationDetails(recordId);
  const spouseQuery = useSpouseApplicationDetails(recordId);

  const applicationResponse = regularQuery.data || spouseQuery.data;
  const application = (applicationResponse as ApplicationDetailsResponse)?.data;

  const isLoading = regularQuery.isLoading || spouseQuery.isLoading;
  const hasError = regularQuery.isError && spouseQuery.isError;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (hasError || !application) {
    return (
      <div className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3 text-gray-400 shrink-0" />
        <span className="text-xs text-gray-500">Unable to load</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-gray-400 shrink-0" />
      <span
        className="text-sm font-medium text-gray-900 truncate max-w-[180px]"
        title={application.Name}
      >
        {application.Name}
      </span>
    </div>
  );
}
