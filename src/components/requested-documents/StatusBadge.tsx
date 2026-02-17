"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "reviewed";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      variant: "secondary" as const,
      icon: Clock,
      className:
        "bg-slate-200 text-slate-900 border border-slate-200 font-medium shadow-xs text-xs px-2 py-1 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600/50",
    },
    reviewed: {
      variant: "secondary" as const,
      icon: Eye,
      className:
        "bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-medium shadow-xs text-xs px-2 py-1 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn("flex items-center gap-1 w-fit", config.className)}
    >
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
