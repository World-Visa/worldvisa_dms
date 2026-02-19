"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDeadlineStats } from "@/hooks/useDeadlineStats";
import { cn } from "@/lib/utils";

interface LodgementDeadlineStatsCardProps {
  type: "visa" | "spouse";
  selectedCategory?:
    | "approaching"
    | "overdue"
    | "noDeadline"
    | "future"
    | null;
  onCategoryClick?: (
    category: "approaching" | "overdue" | "noDeadline" | "future" | null,
  ) => void;
  country?: string;
}

type CategoryKey = "approaching" | "overdue" | "noDeadline" | "future";

interface ChipConfig {
  label: string;
  category: CategoryKey;
  dot: string;
  activeClasses: string;
  inactiveClasses: string;
}

const CHIP_CONFIG: ChipConfig[] = [
  {
    label: "Approaching",
    category: "approaching",
    dot: "bg-amber-400",
    activeClasses:
      "border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/50",
  },
  {
    label: "Overdue",
    category: "overdue",
    dot: "bg-red-500",
    activeClasses:
      "border-red-300 bg-red-50 text-red-800 ring-1 ring-red-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/50",
  },
  {
    label: "No deadline",
    category: "noDeadline",
    dot: "bg-gray-400",
    activeClasses:
      "border-gray-300 bg-gray-50 text-gray-800 ring-1 ring-gray-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50/50",
  },
  {
    label: "Future",
    category: "future",
    dot: "bg-gray-400",
    activeClasses:
      "border-gray-300 bg-gray-50 text-gray-800 ring-1 ring-gray-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50/50",
  },
];

export function LodgementDeadlineStatsCard({
  type,
  selectedCategory,
  onCategoryClick,
  country,
}: LodgementDeadlineStatsCardProps) {
  const { user } = useAuth();
  const canView = user?.role === "master_admin" || user?.role === "team_leader";
  const { data, isLoading, error } = useDeadlineStats(type, canView, undefined, 1, 20, country);

  if (!canView) return null;

  const title =
    type === "visa" ? "Visa lodgement deadlines" : "Spouse lodgement deadlines";
  const isInteractive = !!onCategoryClick;

  if (isLoading) {
    return (
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[80, 72, 96, 64].map((w, i) => (
            <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.summary) {
    return null;
  }

  const { summary } = data;

  const values: Record<CategoryKey, number> = {
    approaching: summary.approaching,
    overdue: summary.overdue,
    noDeadline: summary.noDeadline,
    future: summary.future ?? 0,
  };

  const handleCategoryClick = (category: CategoryKey | null) => {
    if (isInteractive && onCategoryClick) {
      const isActive = selectedCategory === category;
      onCategoryClick(isActive ? null : category);
    }
  };

  return (
    <div className="mb-6 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          Total lodgement applications: {summary.total.toLocaleString()}
        </span>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Lodgement deadline filters"
      >
        {CHIP_CONFIG.map(({ label, category, dot, activeClasses, inactiveClasses }) => {
          const value = values[category];
          const isActive = selectedCategory === category;

          const chipClassName = cn(
            "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150",
            isInteractive
              ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400"
              : "cursor-default",
            isActive ? activeClasses : inactiveClasses,
          );

          const content = (
            <>
              <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
              <span>{label}</span>
              <span
                className={cn(
                  "tabular-nums text-xs font-semibold transition-colors",
                  isActive ? "opacity-90" : "text-gray-500",
                )}
              >
                {value.toLocaleString()}
              </span>
            </>
          );

          if (isInteractive) {
            return (
              <button
                key={category}
                type="button"
                role="checkbox"
                aria-checked={isActive}
                aria-label={`Filter by ${label.toLowerCase()}: ${value} applications`}
                onClick={() => handleCategoryClick(category)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCategoryClick(category);
                  }
                }}
                className={chipClassName}
              >
                {content}
              </button>
            );
          }

          return (
            <span key={category} className={chipClassName}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
