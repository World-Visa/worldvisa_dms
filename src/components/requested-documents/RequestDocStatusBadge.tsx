"use client";

import React from "react";
import { Clock, Eye } from "lucide-react";

import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";

interface StatusBadgeProps {
  status: "pending" | "reviewed";
}

export function RequestDocStatusBadge({ status }: StatusBadgeProps) {
  const config: Record<
    StatusBadgeProps["status"],
    { badgeStatus: "pending" | "completed"; icon: React.ElementType; label: string }
  > = {
    pending: { badgeStatus: "pending", icon: Clock, label: "Pending" },
    reviewed: { badgeStatus: "completed", icon: Eye, label: "Reviewed" },
  };

  const { badgeStatus, icon, label } = config[status] ?? config.pending;

  return (
    <StatusBadge variant="light" status={badgeStatus}>
      <StatusBadgeIcon as={icon} />
      {label}
    </StatusBadge>
  );
}
