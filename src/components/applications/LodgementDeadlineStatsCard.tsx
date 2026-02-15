"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDeadlineStats } from "@/hooks/useDeadlineStats";
import { CalendarClock, AlertCircle, Clock, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

interface LodgementDeadlineStatsCardProps {
  type: "visa" | "spouse";
  selectedCategory?: "approaching" | "overdue" | "noDeadline" | null;
  onCategoryClick?: (
    category: "approaching" | "overdue" | "noDeadline" | null,
  ) => void;
}

export function LodgementDeadlineStatsCard({
  type,
  selectedCategory,
  onCategoryClick,
}: LodgementDeadlineStatsCardProps) {
  const { user } = useAuth();
  const canView = user?.role === "master_admin" || user?.role === "team_leader";
  const { data, isLoading, error } = useDeadlineStats(type, canView);

  if (!canView) return null;

  const title =
    type === "visa" ? "Visa lodgement deadlines" : "Spouse lodgement deadlines";
  const isInteractive = !!onCategoryClick;

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.summary) {
    return null;
  }

  const { summary } = data;

  const stats = [
    {
      label: "Total",
      value: summary.total,
      icon: CalendarClock,
      className: "",
      category: null as null,
    },
    {
      label: "Approaching",
      value: summary.approaching,
      icon: Clock,
      className: "text-amber-600 dark:text-amber-500",
      category: "approaching" as const,
    },
    {
      label: "Overdue",
      value: summary.overdue,
      icon: AlertCircle,
      className: "text-destructive",
      category: "overdue" as const,
    },
    {
      label: "No deadline",
      value: summary.noDeadline,
      icon: FileQuestion,
      className: "text-muted-foreground",
      category: "noDeadline" as const,
    },
  ];

  const handleCategoryClick = (
    category: "approaching" | "overdue" | "noDeadline" | null,
  ) => {
    if (isInteractive) {
      const isActive = selectedCategory === category;
      onCategoryClick(isActive ? null : category);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, className, category }) => {
            // Fix: Only show active if category matches AND is not null
            const isActive = category !== null && selectedCategory === category;
            // Only make card interactive if it's NOT the "Total" card
            const isCardInteractive = isInteractive && category !== null;

            return (
              <div
                key={label}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5",
                  "transition-all duration-200",
                  isCardInteractive &&
                    "cursor-pointer hover:shadow-md hover:border-primary/50 hover:scale-[1.01]",
                  isActive && "ring-2 ring-primary shadow-sm bg-primary/5",
                )}
                {...(isCardInteractive
                  ? {
                      role: "button",
                      tabIndex: 0,
                      "aria-pressed": isActive,
                      "aria-label": `Filter by ${label.toLowerCase()}`,
                      onClick: () => handleCategoryClick(category),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCategoryClick(category);
                        }
                      },
                    }
                  : {})}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
                <span
                  className={`text-lg font-semibold tabular-nums ${className}`}
                >
                  {value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
