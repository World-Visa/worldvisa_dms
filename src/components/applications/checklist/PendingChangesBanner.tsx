"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/button";

interface PendingChangesBannerProps {
  pendingAdditions: unknown[];
  pendingDeletions: string[];
  pendingUpdates: unknown[];
  onClearPendingChanges?: () => void;
  onSavePendingChanges?: () => Promise<void>;
}

export const PendingChangesBanner = memo(function PendingChangesBanner({
  pendingAdditions,
  pendingDeletions,
  pendingUpdates,
  onClearPendingChanges,
  onSavePendingChanges,
}: PendingChangesBannerProps) {
  const hasChanges =
    pendingAdditions.length > 0 ||
    pendingDeletions.length > 0 ||
    pendingUpdates.length > 0;

  if (!hasChanges) return null;

  const getChangesText = () => {
    const parts = [];

    if (pendingAdditions.length > 0) {
      parts.push(`${pendingAdditions.length} to add`);
    }

    if (pendingDeletions.length > 0) {
      parts.push(`${pendingDeletions.length} to remove`);
    }

    if (pendingUpdates.length > 0) {
      parts.push(`${pendingUpdates.length} to update`);
    }

    return parts.join(", ");
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-blue-900">
            Pending Changes
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-700">{getChangesText()}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearPendingChanges}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSavePendingChanges}
              className="text-xs bg-blue-600 hover:bg-blue-700"
            >
              Save Pending Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
