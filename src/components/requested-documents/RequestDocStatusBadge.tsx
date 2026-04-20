"use client";

import React from "react";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { RiCheckboxCircleFill, RiFolderWarningFill } from "react-icons/ri";

interface StatusBadgeProps {
  status: "pending" | "reviewed";
}

export function RequestDocStatusBadge({ status }: StatusBadgeProps) {
  const config: Record<
    StatusBadgeProps["status"],
    { badgeStatus: "pending" | "completed"; icon: React.ElementType; label: string }
  > = {
    pending: { badgeStatus: "pending", icon: RiFolderWarningFill, label: "Pending" },
    reviewed: { badgeStatus: "completed", icon: RiCheckboxCircleFill, label: "Reviewed" },
  };

  const { badgeStatus, icon, label } = config[status] ?? config.pending;

  return (
    <StatusBadge variant="light" status={badgeStatus}>
      <StatusBadgeIcon as={icon} />
      {label}
    </StatusBadge>
  );
}
