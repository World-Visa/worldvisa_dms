import React from "react";
import { ClientDocument } from "@/types/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ClientDocumentsSummaryProps {
  documents: ClientDocument[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function ClientDocumentsSummary({
  documents,
  isLoading,
  error,
}: ClientDocumentsSummaryProps) {
  if (isLoading) {
    return (
      <section className="w-full space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center bg-white border rounded-md px-2 py-3 text-center"
            >
              <Skeleton className="h-8 w-8 rounded-full mb-1" />
              <Skeleton className="h-3 w-12 mb-1" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full space-y-2">
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load documents summary</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      </section>
    );
  }

  if (!documents) {
    return (
      <section className="w-full space-y-2">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No documents data available</p>
        </div>
      </section>
    );
  }

  // Calculate counts by status
  const pendingCount = documents?.filter(
    (doc) => doc.status === "pending",
  ).length;
  const approvedCount = documents?.filter(
    (doc) => doc.status === "approved",
  ).length;
  const rejectedCount = documents?.filter(
    (doc) => doc.status === "rejected",
  ).length;
  const totalCount = documents?.length;

  const summaryCards = [
    {
      title: "Pending",
      count: pendingCount,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Approved",
      count: approvedCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Rejected",
      count: rejectedCount,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <section className="w-full space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <h3 className="font-medium text-base text-gray-900">
          Documents Summary
        </h3>
        <span className="text-xs text-gray-500 border rounded px-2 py-0.5">
          {totalCount} total
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="flex flex-col items-center bg-white border rounded-md px-2 py-3 text-center"
            >
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full ${card.bgColor} mb-1`}
              >
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <span className="text-xs text-gray-500">{card.title}</span>
              <span className="text-lg font-semibold text-gray-900">
                {card.count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
